import React, { useState, useEffect, useRef, useCallback } from 'react';
import 'leaflet/dist/leaflet.css';
import toast, { Toaster } from 'react-hot-toast';
import { AnimatedHeading } from '../components/AnimatedHeading';
import { FadeIn } from '../components/FadeIn';
import { GPSLocationCard } from '../components/women/GPSLocationCard';
import { GuardianContacts } from '../components/women/GuardianContacts';
import { AudioRecording } from '../components/women/AudioRecording';
import { HiddenCamera } from '../components/women/HiddenCamera';
import { PoliceLocator } from '../components/women/PoliceLocator';
import { SafeRoute } from '../components/women/SafeRoute';
import { useSosArduino } from '../hooks/useSosArduino';
import {
  AlertOctagon, Activity, Smartphone,
  XCircle, MapPin, Clock, ShieldAlert, AlertTriangle, Navigation, Cpu
} from 'lucide-react';

// ─── Sticky Risk Banner ───────────────────────────────────────────────────────
const RISK_ZONES = [
  { zone: 'Indiranagar (Current)', level: 'High Risk', color: 'text-red-300 border-red-500/30 bg-red-500/10' },
  { zone: 'Koramangala', level: 'Medium Risk', color: 'text-amber-300 border-amber-500/30 bg-amber-500/10' },
  { zone: 'MG Road', level: 'Low Risk', color: 'text-green-300 border-green-500/30 bg-green-500/10' },
];

const RiskBanner: React.FC<{ onReroute: () => void }> = ({ onReroute }) => {
  const [zoneIdx, setZoneIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setZoneIdx(i => (i + 1) % RISK_ZONES.length), 8000);
    return () => clearInterval(t);
  }, []);
  const zone = RISK_ZONES[zoneIdx];
  return (
    <div className={`sticky top-0 z-30 liquid-glass border rounded-xl px-4 py-2.5 mb-6 flex items-center justify-between gap-3 ${zone.color}`}>
      <div className="flex items-center gap-2 text-sm">
        <AlertTriangle size={14} className="shrink-0 animate-pulse" />
        <span className="font-medium">{zone.zone}:</span>
        <span className="font-bold">{zone.level}</span>
        <span className="text-[11px] opacity-60 hidden sm:block">· Proceed with caution</span>
      </div>
      <button onClick={onReroute} className="flex items-center gap-1.5 text-xs font-bold bg-white/10 hover:bg-white/20 px-3 py-1 rounded-lg transition-colors shrink-0 whitespace-nowrap">
        <Navigation size={11} /> Reroute
      </button>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const WomenSafety: React.FC = () => {
  const [sosStatus, setSosStatus] = useState<'idle' | 'holding' | 'activated' | 'shaking'>('idle');
  const [countdown, setCountdown] = useState(5);
  const [incidents, setIncidents] = useState<{ id: number; msg: string; time: string; loc: string }[]>([]);
  const [sensitivity, setSensitivity] = useState(15);
  const [shakeEnabled, setShakeEnabled] = useState(true);

  const { arduinoConnected, triggerArduinoSos } = useSosArduino();

  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const liveCoordsRef = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          liveCoordsRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        },
        (err) => console.error("Initial GPS failed:", err)
      );

      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          liveCoordsRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        },
        (err) => console.error("GPS Watch failed:", err),
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  /* getBrotherContact - reserved for future use
  const getBrotherContact = () => {
    const saved = localStorage.getItem('raksha_guardians');
    if (saved) {
      try {
        const contacts = JSON.parse(saved);
        const brother = contacts.find((c: { relation?: string; name: string; phone: string }) => c.relation?.toLowerCase() === 'brother');
        if (brother) return brother;
      } catch (e) {
        console.error(e);
      }
    }
    return { name: 'Raj Verma', relation: 'Brother', phone: '+91 96326 30072' };
  };
  */

  const dispatchSOS = useCallback(async (via: 'SMS' | 'WhatsApp') => {
    // ── 1. Get all guardian contacts ──────────────────────────────────────────
    let contacts: { name: string; phone: string }[] = [];
    try {
      const saved = localStorage.getItem('raksha_guardians');
      if (saved) contacts = JSON.parse(saved);
    } catch { /* ignore */ }
    // Fallback to default if none saved
    if (contacts.length === 0) {
      contacts = [{ name: 'Raj Verma', phone: '+91 96326 30072' }];
    }

    // ── 2. Get live GPS ────────────────────────────────────────────────────────
    const lat = liveCoordsRef.current?.lat ?? 12.9716;
    const lng = liveCoordsRef.current?.lng ?? 77.5946;
    const mapsLink = `https://maps.google.com/?q=${lat},${lng}`;

    // ── 3. Get battery level ───────────────────────────────────────────────────
    let batteryStr = 'Unknown';
    try {
      // Battery Status API (Chrome/Android; not available on all browsers)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nav = navigator as any;
      if (typeof nav.getBattery === 'function') {
        const battery = await nav.getBattery();
        const pct = Math.round(battery.level * 100);
        const charging = battery.charging ? ' ⚡ Charging' : '';
        batteryStr = `${pct}%${charging}`;
      }
    } catch { /* Battery API not available — ignore */ }

    // ── 4. Build message ───────────────────────────────────────────────────────
    const msg =
      `🚨 EMERGENCY SOS — RAKSHA ALERT 🚨\n` +
      `I need help immediately!\n\n` +
      `📍 My Live Location:\n${mapsLink}\n\n` +
      `🔋 Battery: ${batteryStr}\n` +
      `🕐 Time: ${new Date().toLocaleTimeString()}\n\n` +
      `Please come to my location or call me right away.\n` +
      `— Sent via Raksha Women Safety`;

    // ── 5. Send WhatsApp / SMS to each contact ─────────────────────────────────
    if (via === 'WhatsApp') {
      contacts.forEach((contact, idx) => {
        const cleanPhone = contact.phone.replace(/[^0-9]/g, '');
        const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
        // Slight delay between tabs so browsers don't block them
        setTimeout(() => window.open(url, '_blank'), idx * 600);
      });
      toast.success(
        `WhatsApp SOS sent to ${contacts.length} contact${contacts.length > 1 ? 's' : ''}!`,
        { id: 'sos-dispatch' }
      );
    } else {
      // SMS — open for first contact (browsers only allow one sms: link)
      const first = contacts[0];
      const smsPhone = first.phone.replace(/[^0-9+]/g, '');
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const sep = isIOS ? '&' : '?';
      window.location.href = `sms:${smsPhone}${sep}body=${encodeURIComponent(msg)}`;
      toast.success('Sent!', { id: 'sos-dispatch' });
    }
  }, []);

  const activateSOS = useCallback((source: string, time: number = 5) => {
    setSosStatus('activated');
    setCountdown(time);
    setIncidents(prev => [
      { id: Date.now(), msg: `SOS triggered via ${source}`, time: new Date().toLocaleTimeString(), loc: '12.9716° N, 77.5946° E' },
      ...prev,
    ].slice(0, 5));
    if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200]);
  }, []);

  const cancelSOS = () => {
    setSosStatus('idle');
    setCountdown(5);
    if (countdownTimer.current) clearInterval(countdownTimer.current);
    toast('SOS Disarmed manually', { style: { background: '#1a1a1a', border: '1px solid #3b82f6', color: '#fff' } });
  };

  useEffect(() => {
    if (sosStatus === 'activated' || sosStatus === 'shaking') {
      let remaining = 5;

      countdownTimer.current = setInterval(() => {
        remaining -= 1;
        setCountdown(remaining);
        if (remaining <= 0) {
          clearInterval(countdownTimer.current!);
          // ── Fire WhatsApp / SMS to guardians ──────────────────────────────
          dispatchSOS('WhatsApp');
          // ── Fire Arduino hardware SOS (GSM SMS + call via COM8) ───────────
          triggerArduinoSos().then((result) => {
            if (result.status === 'SOS triggered') {
              toast.success('📡 Arduino SOS sent via GSM!', {
                id: 'arduino-sos',
                style: { background: '#1a1a1a', border: '1px solid #ef4444', color: '#fff' },
              });
            } else {
              toast.error(`Arduino: ${result.message ?? 'No response'}`, { id: 'arduino-sos' });
            }
          });
          setSosStatus('idle');
        }
      }, 1000);
    }
    return () => { if (countdownTimer.current) clearInterval(countdownTimer.current); };
  }, [sosStatus, dispatchSOS, triggerArduinoSos]);

  useEffect(() => {
    if (!shakeEnabled || sosStatus !== 'idle') return;
    let lastX = 0, lastY = 0, lastZ = 0;
    const handleMotion = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc) return;
      const speed = Math.abs((acc.x || 0) + (acc.y || 0) + (acc.z || 0) - lastX - lastY - lastZ);
      if (speed > sensitivity) { setSosStatus('shaking'); setCountdown(5); }
      lastX = acc.x || 0; lastY = acc.y || 0; lastZ = acc.z || 0;
    };
    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [shakeEnabled, sensitivity, sosStatus]);

  const reqShakePerms = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const DMEvent = DeviceMotionEvent as any;
    if (typeof DMEvent.requestPermission === 'function') {
      try { await DMEvent.requestPermission(); } catch (e) { console.error(e); }
    }
  };



  const sosActive = sosStatus === 'activated';

  return (
    <div className="flex flex-col w-full text-white min-h-[85vh] relative">
      <Toaster position="top-right" />

      {/* ── SOS Activated Overlay ── */}
      {sosActive && (
        <div className="fixed inset-0 z-[1000] bg-red-600/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-[fadeIn_0.2s_ease-out]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent opacity-50 animate-pulse" />
          <AlertOctagon size={120} className="text-white mb-6 animate-pulse" />
          <h1 className="text-6xl md:text-8xl font-light tracking-[-0.04em] text-white text-center mb-4">SOS ACTIVATED</h1>
          <p className="text-xl text-white/80 font-medium tracking-widest uppercase mb-12">Distress Signal Broadcasting</p>

          <div className="text-9xl font-mono text-white/90 mb-12">{countdown}</div>
          <button onClick={cancelSOS} className="z-10 liquid-glass border-2 border-white text-white rounded-xl px-12 py-5 text-xl font-bold tracking-widest hover:bg-white hover:text-red-600 transition-all">
            CANCEL BROADCAST
          </button>

          <p className="mt-8 text-white/60">Help is continuously being dispatched to your location.</p>
        </div>
      )}

      {/* ── Shake Confirm Overlay ── */}
      {sosStatus === 'shaking' && (
        <div className="fixed inset-0 z-[900] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6">
          <Activity size={80} className="text-amber-500 mb-6 animate-bounce" />
          <h2 className="text-4xl text-amber-500 font-bold mb-4">SHAKE DETECTED</h2>
          <p className="text-xl text-gray-300 mb-12 text-center">Activating SOS in {countdown}s…</p>
          <button onClick={cancelSOS} className="bg-white/10 border border-white/20 text-white rounded-xl px-10 py-4 text-lg font-bold hover:bg-white/20 transition-all flex items-center gap-3">
            <XCircle /> DISARM ALERT
          </button>
        </div>
      )}

      {/* ── Sticky Risk Banner ── */}
      <RiskBanner onReroute={() => {
        window.dispatchEvent(new CustomEvent('trigger-safe-route'));
        document.getElementById('safe-route-section')?.scrollIntoView({ behavior: 'smooth' });
      }} />

      {/* ── Page Header ── */}
      <div className="mb-8">
        <AnimatedHeading text={"Women\nSafety."} className="text-3xl md:text-4xl lg:text-5xl font-normal mb-2 tracking-[-0.04em] leading-tight" />
        <FadeIn delay={400}>
          <p className="text-sm text-gray-400 max-w-xl">Immediate protection through SOS, voice, location, and guardian alerts.</p>
        </FadeIn>
      </div>

      {/* ── Row 1: SOS Core + GPS ── */}
      <FadeIn delay={400}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

          {/* SOS Core */}
          <div className="liquid-glass border border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center relative overflow-hidden min-h-[360px]">
            <div className="absolute inset-0 bg-red-500/5 animate-[pulse_3s_infinite] pointer-events-none" />

            {/* Arduino Connection Badge */}
            <div className={`absolute top-4 right-4 flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border ${
              arduinoConnected
                ? 'text-green-400 bg-green-500/10 border-green-500/30'
                : 'text-gray-500 bg-white/5 border-white/10'
            }`}>
              <Cpu size={10} />
              <span className={`w-1.5 h-1.5 rounded-full ${arduinoConnected ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
              {arduinoConnected ? 'Arduino · COM8' : 'Arduino Offline'}
            </div>

            <div className="relative w-[180px] h-[180px] flex items-center justify-center mb-8">
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle cx="90" cy="90" r="80" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                <circle cx="90" cy="90" r="80" fill="none" stroke="#ef4444" strokeWidth="8"
                  strokeDasharray={2 * Math.PI * 80}
                  strokeDashoffset={0}
                  className="animate-pulse" strokeLinecap="round" />
              </svg>
              <button
                type="button"
                onClick={() => activateSOS('SOS Button')}
                className="w-[140px] h-[140px] rounded-full flex flex-col items-center justify-center liquid-glass border-2 transition-all duration-200 z-10 border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)] hover:border-red-500 hover:bg-red-500/10"
              >
                <ShieldAlert size={48} className="text-red-500 mb-2" />
                <span className="text-sm font-bold tracking-widest text-red-100">SOS</span>
              </button>
            </div>
            <h3 className="text-sm tracking-widest text-gray-400 font-medium mb-6 text-center uppercase">Click for SOS</h3>
            <button onClick={() => activateSOS('Instant Tap')} className="w-full max-w-[200px] liquid-glass border border-red-500/30 text-white rounded-lg px-6 py-3 text-sm font-bold tracking-widest hover:bg-red-500/10 hover:border-red-500/60 transition-colors uppercase">
              Instant SOS
            </button>
          </div>

          {/* GPS Location */}
          <GPSLocationCard sosActive={sosActive} />
        </div>
      </FadeIn>

      {/* ── Row 2: Shake + Recorder/Camera + Guardians ── */}
      <FadeIn delay={600}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 items-stretch">
          <div className="flex flex-col gap-6 h-full">
            {/* Shake Detection */}
            <div className="liquid-glass border border-white/10 rounded-xl p-5 flex-1 flex flex-col justify-between" onClick={reqShakePerms}>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-white font-medium mb-1 flex items-center gap-2"><Smartphone size={16} className="text-purple-400" /> Shake Detection</h3>
                  <p className="text-xs text-gray-400">Triggers SOS automatically upon violent motion without unlocking the device.</p>
                </div>
                <div className="flex items-center gap-2" onClick={e => { e.stopPropagation(); setShakeEnabled(v => !v); }}>
                  <span className={`text-[10px] font-bold uppercase ${shakeEnabled ? 'text-green-400' : 'text-gray-500'}`}>{shakeEnabled ? 'Active' : 'Disabled'}</span>
                  <div className={`w-10 h-5 rounded-full relative cursor-pointer ${shakeEnabled ? 'bg-green-500/20 border border-green-500/50' : 'bg-white/10 border border-white/5'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${shakeEnabled ? 'right-0.5 bg-green-400' : 'left-0.5 bg-gray-500'}`} />
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 mt-auto pt-2">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Sensitivity</span><span className="font-mono">{sensitivity}g</span>
                </div>
                <input type="range" min={10} max={40} value={sensitivity} onChange={e => setSensitivity(Number(e.target.value))} className="w-full accent-purple-500" disabled={!shakeEnabled} />
                <div className="flex justify-between text-[10px] text-gray-500"><span>Easy (Jogging)</span><span>Hard (Drop)</span></div>
              </div>
            </div>

            {/* Silent Recording Mode */}
            <AudioRecording className="flex-1" />

            {/* Silent Camera Mode */}
            <HiddenCamera className="flex-1" />
          </div>

          {/* Guardian Contacts */}
          <GuardianContacts sosActive={sosActive} className="h-full" />
        </div>
      </FadeIn>

      {/* ── Row 4: Police Locator ── */}
      <FadeIn delay={800}>
        <div className="mb-6">
          <PoliceLocator />
        </div>
      </FadeIn>

      {/* ── Row 5: Safe Route (toggle or always shown) ── */}
      <FadeIn delay={900}>
        <div id="safe-route-section" className="mb-6">
          <SafeRoute />
        </div>
      </FadeIn>

      {/* ── Incident Logs ── */}
      <FadeIn delay={1000} className="liquid-glass border border-white/10 rounded-xl p-6 flex flex-col min-h-[200px] mb-6">
        <h3 className="text-sm font-semibold tracking-wider text-white mb-4 flex items-center justify-between">
          <span>LOCAL INCIDENT LOGS</span>
          <span className="bg-white/10 px-2 py-0.5 rounded text-[10px] font-mono">{incidents.length} Records</span>
        </h3>
        <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-1">
          {incidents.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-sm text-gray-500">No telemetry instances registered.</div>
          ) : incidents.map(inc => (
            <div key={inc.id} className="bg-white/5 border border-white/5 rounded-lg p-4 flex flex-col animate-[slideIn_0.3s_ease-out]">
              <div className="flex justify-between items-start mb-2">
                <span className="text-red-400 font-bold text-sm">{inc.msg}</span>
                <span className="text-[10px] bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded">CRITICAL</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span className="flex items-center gap-1"><Clock size={12} /> {inc.time}</span>
                <span className="flex items-center gap-1"><MapPin size={12} /> {inc.loc}</span>
              </div>
            </div>
          ))}
        </div>
      </FadeIn>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
      ` }} />
    </div>
  );
};
