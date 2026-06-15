import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Phone, X, Plus, CheckCircle, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

interface Guardian {
  id: number;
  name: string;
  relation: string;
  phone: string;
  notified?: string;
  notifiedVia?: 'SMS' | 'WhatsApp';
}

const INITIAL: Guardian[] = [
  { id: 1, name: 'Meera Sharma', relation: 'Mother', phone: '+91 87920 74989' },
  { id: 2, name: 'Raj Verma', relation: 'Brother', phone: '+91 96326 30072' },
  { id: 3, name: 'Suresh Nair', relation: 'Father', phone: '+91 81971 49231' },
];

function initials(name: string) { return name.split(' ').map(n => n[0]).join('').toUpperCase(); }

const COLORS = ['bg-purple-500/30 text-purple-300', 'bg-blue-500/30 text-blue-300', 'bg-green-500/30 text-green-300', 'bg-amber-500/30 text-amber-300'];

interface Props { sosActive: boolean; className?: string; }

export const GuardianContacts: React.FC<Props> = ({ sosActive, className = '' }) => {
  const [guardians, setGuardians] = useState<Guardian[]>(() => {
    const saved = localStorage.getItem('raksha_guardians');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL.map(g =>
      sosActive ? { ...g, notified: new Date().toLocaleTimeString(), notifiedVia: 'SMS' } : g
    );
  });
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', relation: '', phone: '' });

  const coordsRef = React.useRef<{ lat: number; lng: number } | null>(null);

  React.useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          coordsRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        },
        (err) => console.error("Guardian GPS failed:", err)
      );

      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          coordsRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        },
        (err) => console.error("Guardian GPS Watch failed:", err),
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  React.useEffect(() => {
    localStorage.setItem('raksha_guardians', JSON.stringify(guardians));
  }, [guardians]);

  React.useEffect(() => {
    if (sosActive) {
      const now = new Date().toLocaleTimeString();
      setGuardians(prev => prev.map(g => ({ ...g, notified: g.notified ?? now, notifiedVia: g.notifiedVia ?? 'SMS' })));
    }
  }, [sosActive]);

  const notify = (id: number, via: 'SMS' | 'WhatsApp') => {
    const now = new Date().toLocaleTimeString();
    setGuardians(prev => prev.map(g => g.id === id ? { ...g, notified: now, notifiedVia: via } : g));
    toast.success('Sent!', { id: 'sos-dispatch', style: { background: '#1a1a1a', border: '1px solid #22c55e', color: '#fff' } });
  };

  const handleSMS = (guardian: Guardian) => {
    const baseMsg = `EMERGENCY SOS!\nI need help immediately! Alert from Raksha Women Safety.`;
    const lat = coordsRef.current?.lat || 12.9716;
    const lng = coordsRef.current?.lng || 77.5946;
    const locStr = ` Location: https://maps.google.com/?q=${lat},${lng}`;
    const text = `${baseMsg}${locStr}`;
    const smsPhone = guardian.phone.replace(/[^0-9+]/g, '');
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const separator = isIOS ? '&' : '?';
    const url = `sms:${smsPhone}${separator}body=${encodeURIComponent(text)}`;
    window.location.href = url;
    notify(guardian.id, 'SMS');
  };

  const handleWhatsApp = async (guardian: Guardian) => {
    const lat = coordsRef.current?.lat || 12.9716;
    const lng = coordsRef.current?.lng || 77.5946;
    const mapsLink = `https://maps.google.com/?q=${lat},${lng}`;

    // Fetch battery level
    let batteryStr = 'Unknown';
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nav = navigator as any;
      if (typeof nav.getBattery === 'function') {
        const battery = await nav.getBattery();
        const pct = Math.round(battery.level * 100);
        batteryStr = `${pct}%${battery.charging ? ' ⚡ Charging' : ''}`;
      }
    } catch { /* Battery API not available */ }

    const text =
      `🚨 EMERGENCY SOS — RAKSHA ALERT 🚨\n` +
      `I need help immediately!\n\n` +
      `📍 My Live Location:\n${mapsLink}\n\n` +
      `🔋 Battery: ${batteryStr}\n` +
      `🕐 Time: ${new Date().toLocaleTimeString()}\n\n` +
      `Please come to my location or call me right away.\n` +
      `— Sent via Raksha Women Safety`;

    const cleanPhone = guardian.phone.replace(/[^0-9]/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    notify(guardian.id, 'WhatsApp');
  };

  const addGuardian = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) return;
    setGuardians(prev => [...prev, { id: Date.now(), ...form }]);
    setForm({ name: '', relation: '', phone: '' });
    setShowModal(false);
    toast.success('Guardian added!', { style: { background: '#1a1a1a', border: '1px solid #22c55e', color: '#fff' } });
  };

  return (
    <div className={`liquid-glass border border-white/10 rounded-xl p-5 flex flex-col ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold tracking-wider flex items-center gap-2">
          <Phone size={14} className="text-blue-400" /> GUARDIAN CONTACTS
        </h3>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-1 text-[11px] bg-white/10 hover:bg-white/20 px-2 py-1 rounded-lg transition-colors">
          <Plus size={11} /> Add
        </button>
      </div>

      <div className="flex flex-col gap-3 flex-1 justify-between">
        {guardians.map((g, i) => (
          <div key={g.id} className="liquid-glass border border-white/10 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${COLORS[i % COLORS.length]}`}>
                {initials(g.name)}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-white truncate">{g.name}</div>
                <div className="text-[10px] text-gray-400">{g.relation}</div>
              </div>
            </div>
            <div className="text-xs text-gray-400 font-mono">{g.phone}</div>
            
            <div className="flex flex-col gap-2">
              {g.notified && (
                <span className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-green-400 bg-green-500/10 border border-green-500/30 px-2 py-1 rounded-lg">
                  <CheckCircle size={10} /> SENT VIA {g.notifiedVia?.toUpperCase()} · {g.notified}
                </span>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleSMS(g)}
                  className="flex-1 text-[11px] bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg py-1.5 transition-colors font-semibold border border-blue-500/30 flex items-center justify-center gap-1.5"
                >
                  <MessageSquare size={11} /> SMS
                </button>
                <button
                  type="button"
                  onClick={() => handleWhatsApp(g)}
                  className="flex-1 text-[11px] bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg py-1.5 transition-colors font-semibold border border-emerald-500/30 flex items-center justify-center gap-1.5"
                >
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current shrink-0">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.588 1.451 5.407 1.452 5.54.004 10.05-4.505 10.054-10.045.002-2.684-1.038-5.207-2.93-7.098C17.29 1.57 14.768.53 12.013.53c-5.546 0-10.059 4.51-10.06 10.052-.001 1.83.48 3.62 1.39 5.2l-.998 3.64 3.713-.974zM17.47 14.39c-.3-.149-1.777-.878-2.076-.985-.299-.107-.517-.16-.735.168-.218.327-.843 1.066-1.034 1.285-.19.218-.38.244-.68.095-.3-.15-1.265-.467-2.41-1.485-.89-.794-1.492-1.775-1.667-2.074-.175-.3-.019-.462.13-.61.135-.133.3-.349.45-.523.15-.174.2-.299.3-.498.1-.2.05-.374-.025-.523-.075-.15-.735-1.77-1.007-2.422-.265-.636-.53-.55-.735-.56-.19-.008-.408-.01-.625-.01-.218 0-.573.082-.872.408-.3.326-1.144 1.116-1.144 2.72 0 1.605 1.169 3.159 1.33 3.376.162.218 2.299 3.51 5.568 4.922.778.336 1.385.537 1.857.687.781.248 1.49.213 2.052.129.626-.094 1.777-.727 2.025-1.429.248-.7.248-1.3 1.73-.149z" />
                  </svg> WhatsApp
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && createPortal(
        <div className="fixed inset-0 z-[1100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="liquid-glass border border-white/10 rounded-2xl p-6 max-w-sm w-full">
            <div className="flex items-center justify-between mb-5">
              <h4 className="text-sm font-semibold">Add Guardian</h4>
              <button onClick={() => setShowModal(false)}><X size={16} className="text-gray-400 hover:text-white" /></button>
            </div>
            <form onSubmit={addGuardian} className="flex flex-col gap-3">
              {[['Name', 'name', 'Full name'], ['Relation', 'relation', 'e.g. Mother, Friend'], ['Phone', 'phone', '+91 XXXXX XXXXX']].map(([label, key, ph]) => (
                <div key={key}>
                  <label className="text-xs text-gray-400 block mb-1">{label}</label>
                  <input
                    placeholder={ph}
                    value={(form as any)[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
                  />
                </div>
              ))}
              <div className="flex gap-2 mt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors">Add</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
