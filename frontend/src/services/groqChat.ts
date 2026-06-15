// ─── Gemini Chat Service for RAKSHA AI ───────────────────────────────────────
// Powered by Google Gemini — integrated into Raksha Nexus platform.

const GEMINI_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';
const GEMINI_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.1-8b-instant';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Compact system prompt — keeps full feature awareness under ~600 tokens
const SYSTEM_PROMPT = `You are RAKSHA AI, the emergency assistant powered by Google Gemini in the Raksha Nexus disaster management & women safety platform (Bangalore, India).

PLATFORM FEATURES YOU CAN ACCESS:
- Dashboard (/dashboard): Live threat map, incident feed, risk scores per zone
- Crisis Response (/crisis): Tabs for Fire&Smoke (sensors, sprinklers), Crowd&Stampede (density, evacuation routes), Flood (reservoir gauges, radar), Violence (CCTV AI detection), Medical (dispatch form, hospital ETA). Also has Smart Evacuation Controller and Emergency Broadcast.
- Women Safety (/women-safety): SOS button (5s countdown→WhatsApp/SMS to guardians + Arduino GSM), Instant SOS, GPS tracking, Shake Detection (auto-SOS on violent motion), Silent Audio Recording, Hidden Camera, Guardian Contacts manager, Police Locator, Safe Route Navigator, Arduino Wearable (COM8)
- AI Intelligence (/ai-intelligence): Threat prediction grid (16 zones), hourly risk charts, Resource Allocation AI (accept/dismiss deployments), Predictive Trends, Crime-Prone Areas ranking, Smart Route Optimizer (Ambulance/Patrol/FireTruck), Crowd Density Monitor, Anomaly Detection Log
- Public Tools (/public-tools): Nearby Finder (hospitals/police with map), Crisis Report (multi-step with QR code), Voice Assistant (speech commands)
- Offline Mesh (/offline): SMS Fallback, Wi-Fi Direct messaging, Bluetooth Mesh Visualizer, Low Network Mode (emergency-only UI)
- Admin Panel (/admin): Incident management, analytics, CCTV, AI dashboard
- Settings (/settings), Advanced (/advanced)

EMERGENCY CONTACTS: Police 100, Fire 101, Ambulance 108, Women Helpline 181, Disaster 1078. Nearest: Indiranagar Police 080-2294-2541 (0.8km), Manipal Hospital 080-2222-1111 (1.2km).

RULES: Be concise (2-4 sentences). Be professional and action-oriented. Tell users exactly which page/tab/button to use. Provide first-aid guidance when asked. If distress detected, suggest SOS immediately. Do NOT use emojis in responses — keep a clean, professional tone. You are powered by Google Gemini.`;

function buildContextMessage(): string {
  const parts: string[] = [];
  try {
    const reports = JSON.parse(localStorage.getItem('raksha_crisis_reports') || '[]');
    if (reports.length > 0) {
      const pending = reports.filter((r: any) => r.status === 'Pending').length;
      parts.push(`${reports.length} crisis reports (${pending} pending). Latest: ${reports[0]?.type} at ${reports[0]?.location} [${reports[0]?.severity}].`);
    }
  } catch { /* */ }
  try {
    const g = JSON.parse(localStorage.getItem('raksha_guardians') || '[]');
    if (g.length > 0) parts.push(`${g.length} guardian(s): ${g.map((c: any) => c.name).join(', ')}.`);
  } catch { /* */ }
  parts.push(`Time: ${new Date().toLocaleTimeString()}. Network: ${navigator.onLine ? 'Online' : 'OFFLINE'}.`);
  return parts.join(' ');
}

async function fetchWithRetry(body: object, retries = 2): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GEMINI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (res.status === 429 && attempt < retries) {
      // Parse retry-after or use exponential backoff
      const retryAfter = res.headers.get('retry-after');
      const waitMs = retryAfter ? parseFloat(retryAfter) * 1000 : (attempt + 1) * 3000;
      await new Promise(r => setTimeout(r, Math.min(waitMs, 10000)));
      continue;
    }
    return res;
  }
  throw new Error('Rate limit exceeded after retries');
}

// Google Translate language code mapping
const LANG_CODES: Record<string, string> = {
  'English': 'en',
  'Kannada': 'kn',
  'Telugu': 'te',
  'Tamil': 'ta',
  'Hindi': 'hi',
  'Malayalam': 'ml',
};

async function translateLine(line: string, langCode: string): Promise<string> {
  // Skip empty lines or lines that are just formatting/URLs/paths
  const trimmed = line.trim();
  if (!trimmed || /^[\/\(\)\[\]\*\-\—\|#>]+$/.test(trimmed)) return line;
  if (/^https?:\/\//.test(trimmed)) return line;
  if (/^\/[a-z\-]+/.test(trimmed) && trimmed.length < 30) return line; // route paths like /dashboard

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${langCode}&dt=t&q=${encodeURIComponent(trimmed)}`;
    const res = await fetch(url);
    if (!res.ok) return line;
    const data = await res.json();
    const translated = data[0]?.map((seg: any[]) => seg[0]).join('') || line;
    return translated;
  } catch {
    return line;
  }
}

async function translateText(text: string, targetLang: string): Promise<string> {
  const langCode = LANG_CODES[targetLang];
  if (!langCode || langCode === 'en') return text;

  try {
    // Split into lines, translate each separately for consistent output
    const lines = text.split('\n');
    const translated = await Promise.all(
      lines.map(line => translateLine(line, langCode))
    );
    return translated.join('\n');
  } catch {
    return text;
  }
}

export async function sendChatMessage(messages: ChatMessage[], language: string = 'English'): Promise<string> {
  // Keep only last 10 messages to minimize token usage
  const trimmedMessages = messages.slice(-10);

  const fullMessages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT + '\n\n[LIVE] ' + buildContextMessage() },
    ...trimmedMessages,
  ];

  try {
    const response = await fetchWithRetry({
      model: MODEL,
      messages: fullMessages,
      temperature: 0.7,
      max_tokens: 512,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error?.message || `API error ${response.status}`);
    }

    const data = await response.json();
    let result = data.choices?.[0]?.message?.content || 'I could not generate a response. Please try again.';

    // Translate to selected language using Google Translate
    if (language !== 'English') {
      result = await translateText(result, language);
    }

    return result;
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    if (error.message?.includes('Rate limit') || error.message?.includes('rate_limit')) {
      return 'Rate limit reached — please wait a few seconds and try again.';
    }
    if (!navigator.onLine) {
      return 'You\'re offline. Use **Offline Mesh** (/offline) for emergency comms — SMS Fallback, Wi-Fi Direct, or Bluetooth Mesh.';
    }
    return `Connection error: ${error.message}`;
  }
}
