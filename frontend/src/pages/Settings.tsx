import React, { useState, useEffect } from 'react';
import { AnimatedHeading } from '../components/AnimatedHeading';
import { FadeIn } from '../components/FadeIn';
import { Bell, Moon, Smartphone, Volume2, CheckCircle, RotateCcw } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const NOTIFICATION_SETTINGS = [
  { label: 'Critical Alerts (SOS)', desc: 'Push notifications for SOS and critical incidents', enabled: true },
  { label: 'Zone Update Alerts', desc: 'Notify when zone risk level changes', enabled: true },
  { label: 'Daily Summary Digest', desc: 'Receive a daily incident summary at 18:00', enabled: false },
  { label: 'AI Prediction Warnings', desc: 'Get advance notices from predictive models', enabled: true },
  { label: 'System Health Alerts', desc: 'Alerts for mesh node failures or API downtime', enabled: false },
];

const ALERT_SOUNDS = [
  { id: 'tactical', label: 'Tactical Beep', freq: 880, duration: 150, pattern: [1, 1, 1] },
  { id: 'chime', label: 'Soft Chime', freq: 523, duration: 300, pattern: [1, 0, 1] },
  { id: 'silent', label: 'Silent', freq: 0, duration: 0, pattern: [] },
  { id: 'siren', label: 'Siren', freq: 660, duration: 200, pattern: [1, 1, 1, 1] },
];

const STORAGE_KEY = 'raksha_settings';

function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch { return {}; }
}

function playTone(freq: number, duration: number) {
  if (!freq) return;
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.value = 0.15;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);
    osc.stop(ctx.currentTime + duration / 1000 + 0.05);
  } catch { /* audio not available */ }
}

export const Settings: React.FC = () => {
  const stored = loadSettings();
  const [notifs, setNotifs] = useState(stored.notifs || NOTIFICATION_SETTINGS.map(n => n.enabled));
  const [sound, setSound] = useState(stored.sound || 'tactical');
  const [textSize, setTextSize] = useState(stored.textSize || 14);
  const [saved, setSaved] = useState(false);

  // Apply text size in real-time
  useEffect(() => {
    document.documentElement.style.fontSize = `${textSize}px`;
    return () => { document.documentElement.style.fontSize = ''; };
  }, [textSize]);

  const handleSave = () => {
    const settings = { notifs, sound, textSize };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setSaved(true);
    toast.success('Settings saved and applied.', { style: { background: '#1a1a1a', border: '1px solid #22c55e', color: '#fff' } });
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    localStorage.removeItem(STORAGE_KEY);
    setNotifs(NOTIFICATION_SETTINGS.map(n => n.enabled));
    setSound('tactical');
    setTextSize(14);
    document.documentElement.style.fontSize = '';
    toast('Settings reset to defaults.', { icon: '↺', style: { background: '#1a1a1a', border: '1px solid #555', color: '#fff' } });
  };

  const handleSoundPreview = (s: typeof ALERT_SOUNDS[0]) => {
    setSound(s.id);
    if (s.pattern.length === 0) {
      toast('Silent mode — no sound will play.', { style: { background: '#1a1a1a', border: '1px solid #555', color: '#fff' } });
      return;
    }
    // Play the pattern
    s.pattern.forEach((beat, i) => {
      if (beat) setTimeout(() => playTone(s.freq, s.duration), i * (s.duration + 80));
    });
  };

  return (
    <div className="flex flex-col w-full text-white">
      <Toaster position="top-right" />

      <div className="mb-8">
        <AnimatedHeading text={"Settings."} className="text-3xl md:text-4xl lg:text-5xl font-normal mb-2 tracking-[-0.04em] leading-tight" />
        <FadeIn delay={400}>
          <p className="text-sm text-gray-400">Personalize your RAKSHA Nexus experience — notifications, display, and preferences.</p>
        </FadeIn>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Notification Settings */}
        <FadeIn delay={400}>
          <div className="liquid-glass border border-white/10 rounded-xl p-6">
            <h3 className="text-sm font-semibold tracking-wider mb-6 flex items-center gap-2">
              <Bell size={14} className="text-amber-400" /> NOTIFICATIONS
            </h3>
            <div className="flex flex-col gap-4">
              {NOTIFICATION_SETTINGS.map((n, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                  <div>
                    <div className="text-sm font-medium text-white">{n.label}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{n.desc}</div>
                  </div>
                  <button
                    onClick={() => {
                      setNotifs((prev: boolean[]) => { const next = [...prev]; next[i] = !next[i]; return next; });
                      toast(notifs[i] ? `${n.label} disabled` : `${n.label} enabled`, { style: { background: '#1a1a1a', border: '1px solid #333', color: '#fff' }, duration: 1500 });
                    }}
                    className={`ml-4 shrink-0 w-10 h-5 rounded-full relative transition-colors ${notifs[i] ? 'bg-green-500/30 border border-green-500/50' : 'bg-white/10 border border-white/10'}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${notifs[i] ? 'right-0.5 bg-green-400' : 'left-0.5 bg-gray-500'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* Display & Preferences */}
        <FadeIn delay={500}>
          <div className="liquid-glass border border-white/10 rounded-xl p-6 flex flex-col gap-6">
            <h3 className="text-sm font-semibold tracking-wider flex items-center gap-2">
              <Moon size={14} className="text-purple-400" /> DISPLAY & PREFERENCES
            </h3>


            {/* Alert Sound */}
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2 flex items-center gap-2"><Volume2 size={12} /> Alert Sound <span className="text-gray-600 normal-case">(click to preview)</span></label>
              <div className="flex flex-wrap gap-2">
                {ALERT_SOUNDS.map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleSoundPreview(s)}
                    className={`px-4 py-2 rounded-lg text-sm border transition-all ${sound === s.id ? 'bg-white text-black border-white' : 'border-white/10 text-gray-400 hover:text-white hover:bg-white/5'}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Text Size */}
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2 flex items-center gap-2"><Smartphone size={12} /> Interface Text Size: <span className="text-white font-mono">{textSize}px</span></label>
              <input type="range" min={12} max={20} value={textSize} onChange={e => setTextSize(Number(e.target.value))} className="w-full accent-emerald-500" />
              <div className="flex justify-between text-[10px] text-gray-600 mt-1"><span>Small</span><span>Default (14)</span><span>Large</span></div>
              {/* Live preview */}
              <div className="mt-2 p-3 bg-white/5 rounded-lg border border-white/5">
                <span className="text-gray-300" style={{ fontSize: `${textSize}px` }}>Sample text at {textSize}px</span>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>

      {/* Save / Reset */}
      <FadeIn delay={800}>
        <div className="flex justify-end gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 text-gray-300 font-medium rounded-xl hover:bg-white/10 transition-colors text-sm"
          >
            <RotateCcw size={14} /> Reset Defaults
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-8 py-3 bg-white text-black font-medium rounded-xl hover:bg-gray-100 transition-colors text-sm"
          >
            {saved ? <CheckCircle size={16} className="text-green-600" /> : null}
            {saved ? 'Saved!' : 'Save Settings'}
          </button>
        </div>
      </FadeIn>
    </div>
  );
};
