import React, { useState, useEffect } from 'react';
import { AnimatedHeading } from '../components/AnimatedHeading';
import { FadeIn } from '../components/FadeIn';
import {
  Crosshair, Battery, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Video,
  Heart, ShieldAlert, PhoneCall, Stethoscope, Umbrella,
  Wind, Car, Bus, Settings as SettingsIcon, Zap, Droplets, RefreshCw, X, BookOpen
} from 'lucide-react';
import { MapContainer, TileLayer, Polyline, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import toast, { Toaster } from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import { QRCodeCanvas } from 'qrcode.react';

// Leaflet default icon fix
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// --- SUB-COMPONENTS ---



const AutoFIRGenerator = ({ onExit }: { onExit: () => void }) => {
  const [step, setStep] = useState(1);
  const [caseRef, setCaseRef] = useState('');

  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 16),
    type: 'Theft / Burglary',
    location: '',
    description: '',
    severity: 'Medium',
    compName: '',
    compIDType: 'Aadhaar',
    compIDNum: '',
    compContact: '',
    compAddress: '',
    showSuspect: false,
    suspectApp: '',
    suspectVehicle: '',
    suspectDir: '',
    witnesses: [] as string[],
    newWitness: '',
    notes: '',
    officerName: 'Sgt. Ramesh K.',
    officerBadge: 'BLR-8492'
  });

  // Map pin placeholder (simplified for mock)

  const handleGenerate = () => {
    setCaseRef(`FIR-${Date.now().toString().slice(-6)}`);
    setStep(4);
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("FIRST INFORMATION REPORT", 105, 20, { align: "center" });

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    let y = 40;
    doc.text(`Case Reference: ${caseRef}`, 20, y); y += 10;
    doc.text(`Date & Time: ${formData.date.replace('T', ' ')}`, 20, y); y += 10;
    doc.text(`Incident Type: ${formData.type} (${formData.severity} Severity)`, 20, y); y += 10;
    doc.text(`Location: ${formData.location || 'GPS Coordinates Pinned'}`, 20, y); y += 15;

    doc.setFont("helvetica", "bold");
    doc.text("Description of Incident:", 20, y); y += 8;
    doc.setFont("helvetica", "normal");
    const splitDesc = doc.splitTextToSize(formData.description || 'No description provided.', 170);
    doc.text(splitDesc, 20, y);
    y += (splitDesc.length * 7) + 10;

    doc.setFont("helvetica", "bold");
    doc.text("Complainant Details:", 20, y); y += 8;
    doc.setFont("helvetica", "normal");
    doc.text(`Name: ${formData.compName}`, 20, y); y += 8;
    doc.text(`Contact: ${formData.compContact}`, 20, y); y += 8;
    doc.text(`Address: ${formData.compAddress}`, 20, y); y += 15;

    doc.setLineWidth(0.5);
    doc.line(20, y, 190, y); y += 15;

    doc.text(`Officer in Charge: ${formData.officerName} (${formData.officerBadge})`, 20, y); y += 30;
    doc.text("__________________________", 20, y);
    doc.text("Authorized Signature", 20, y + 8);

    const qrCanvas = document.getElementById("fir-qr") as HTMLCanvasElement;
    if (qrCanvas) {
      doc.addImage(qrCanvas.toDataURL("image/png"), "PNG", 150, y - 20, 30, 30);
    }

    doc.save(`${caseRef}.pdf`);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateForm = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0a0a0a] text-white flex flex-col p-4 md:p-8 overflow-y-auto font-sans">
      <div className="max-w-3xl mx-auto w-full">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold uppercase tracking-widest text-white flex items-center gap-3">
            Auto FIR Generator
          </h1>
          <button onClick={onExit} className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-colors"><X size={20} /></button>
        </div>

        {step < 4 && (
          <div className="mb-8">
            <div className="flex justify-between text-xs text-gray-400 font-mono mb-2 uppercase">
              <span className={step >= 1 ? 'text-teal-400' : ''}>Step 1: Incident</span>
              <span className={step >= 2 ? 'text-teal-400' : ''}>Step 2: People</span>
              <span className={step >= 3 ? 'text-teal-400' : ''}>Step 3: Submit</span>
            </div>
            <div className="liquid-glass border border-white/10 rounded-full h-1 overflow-hidden">
              <div className="h-full bg-teal-500 transition-all duration-500" style={{ width: `${(step / 3) * 100}%` }} />
            </div>
          </div>
        )}

        {step === 1 && (
          <FadeIn className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Date & Time</label>
                <input type="datetime-local" value={formData.date} onChange={e => updateForm('date', e.target.value)} className="liquid-glass border border-white/10 rounded-lg px-4 py-3 bg-transparent text-white w-full focus:outline-none focus:border-white/30" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Incident Type</label>
                <select value={formData.type} onChange={e => updateForm('type', e.target.value)} className="liquid-glass border border-white/10 rounded-lg px-4 py-3 bg-transparent text-white w-full focus:outline-none focus:border-white/30 appearance-none">
                  <option className="bg-gray-900">Theft / Burglary</option>
                  <option className="bg-gray-900">Assault / Violence</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Description</label>
              <textarea rows={4} value={formData.description} onChange={e => updateForm('description', e.target.value)} className="liquid-glass border border-white/10 rounded-lg px-4 py-3 bg-transparent text-white w-full focus:outline-none focus:border-white/30 resize-none" />
            </div>
            <button onClick={() => setStep(2)} className="w-full bg-teal-600 hover:bg-teal-500 transition-colors text-white py-3 rounded-xl font-medium mt-4">Next Step</button>
          </FadeIn>
        )}

        {step === 2 && (
          <FadeIn className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-400 mb-1.5">Full Name</label>
                <input type="text" value={formData.compName} onChange={e => updateForm('compName', e.target.value)} className="liquid-glass border border-white/10 rounded-lg px-4 py-3 bg-transparent text-white w-full focus:outline-none focus:border-white/30" />
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button onClick={() => setStep(1)} className="flex-1 bg-white/10 text-white py-3 rounded-xl font-medium">Back</button>
              <button onClick={() => setStep(3)} className="flex-1 bg-teal-600 text-white py-3 rounded-xl font-medium">Next Step</button>
            </div>
          </FadeIn>
        )}

        {step === 3 && (
          <FadeIn className="space-y-6">
            <div className="flex gap-4 mt-8">
              <button onClick={() => setStep(2)} className="flex-1 bg-white/10 text-white py-3 rounded-xl font-medium">Back</button>
              <button onClick={handleGenerate} className="flex-[2] bg-teal-600 hover:bg-teal-500 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2">
                Generate Official FIR
              </button>
            </div>
          </FadeIn>
        )}

        {step === 4 && (
          <FadeIn className="space-y-6">
            <div className="liquid-glass border border-white/10 rounded-xl p-8 bg-white text-black font-serif relative">
              <div className="text-center mb-8 border-b-2 border-black pb-4">
                <h2 className="text-2xl font-bold">FIRST INFORMATION REPORT</h2>
              </div>
              <div className="grid grid-cols-2 gap-y-4 text-sm mb-8">
                <div><span className="font-bold">Case Reference:</span> {caseRef}</div>
                <div><span className="font-bold">Date/Time:</span> {formData.date}</div>
              </div>
              <div className="text-center absolute bottom-8 right-8">
                <QRCodeCanvas id="fir-qr" value={`https://raksha-nexus.gov/fir/${caseRef}`} size={64} level="H" />
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={downloadPDF} className="flex-[2] bg-white text-black py-3.5 rounded-xl font-medium">Download PDF</button>
            </div>
          </FadeIn>
        )}
      </div>
    </div>
  );
};

const RuralEmergencyMode = ({ onExit }: { onExit: () => void }) => {
  const speak = (text: string) => {
    const u = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(u);
  };

  const handleAlert = (type: string, msg: string) => {
    speak(msg);
    toast.success(`${type} alert triggered!`);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0a0a0a] text-white flex flex-col p-4 md:p-8 overflow-y-auto font-sans">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold uppercase tracking-widest text-green-400">RURAL EMERGENCY MODE</h1>
        <button onClick={onExit} className="bg-white/10 hover:bg-white/20 p-3 rounded-full transition-colors"><X size={24} /></button>
      </div>

      <div className="flex flex-col gap-6 flex-1 max-w-md mx-auto w-full justify-center">
        <button
          onClick={() => handleAlert('Medical', 'Medical emergency activated. Help is on the way.')}
          className="w-full h-[120px] bg-red-600 rounded-3xl flex flex-col items-center justify-center gap-2 shadow-[0_10px_0_rgb(153,27,27)] active:translate-y-[10px] active:shadow-none transition-all"
        >
          <Stethoscope size={48} />
          <span className="text-xl font-bold uppercase tracking-widest">Medical</span>
        </button>
        <button
          onClick={() => handleAlert('Safety', 'Safety threat registered. Alerting local community guards.')}
          className="w-full h-[120px] bg-amber-500 rounded-3xl flex flex-col items-center justify-center gap-2 shadow-[0_10px_0_rgb(180,83,9)] active:translate-y-[10px] active:shadow-none transition-all text-black"
        >
          <ShieldAlert size={48} />
          <span className="text-xl font-bold uppercase tracking-widest">Safety</span>
        </button>
        <button
          onClick={() => handleAlert('Disaster', 'Natural disaster protocol initiated. Move to high ground.')}
          className="w-full h-[120px] bg-blue-600 rounded-3xl flex flex-col items-center justify-center gap-2 shadow-[0_10px_0_rgb(30,58,138)] active:translate-y-[10px] active:shadow-none transition-all"
        >
          <Umbrella size={48} />
          <span className="text-xl font-bold uppercase tracking-widest">Disaster</span>
        </button>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mt-4">
          <h3 className="text-xs text-gray-400 uppercase tracking-widest mb-3">Nearest Health Worker</h3>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center border border-green-500/30">
              <PhoneCall size={20} />
            </div>
            <div>
              <div className="font-medium">ASHA Worker: Asha Devi</div>
              <div className="text-sm text-gray-400">Distance: 1.2 km</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CampusSafetyMode = ({ onExit }: { onExit: () => void }) => {
  return (
    <div className="fixed inset-0 z-[9999] bg-[#0a0a0a] text-white flex flex-col p-4 md:p-8 overflow-y-auto font-sans">
      <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
        <h1 className="text-2xl font-bold uppercase tracking-widest text-blue-400 flex items-center gap-3">
          <BookOpen size={28} /> CAMPUS SAFETY MODE
        </h1>
        <button onClick={onExit} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm">
          Exit Campus Mode <X size={16} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="liquid-glass border border-white/10 rounded-2xl p-6 h-[400px] flex flex-col">
            <h2 className="text-sm font-semibold tracking-wider text-gray-400 mb-4 uppercase">Campus Map & Check-ins</h2>
            <div className="flex-1 bg-white/5 rounded-xl border border-white/10 relative overflow-hidden flex items-center justify-center">
              <svg viewBox="0 0 800 400" className="w-full h-full opacity-50">
                <rect x="100" y="50" width="200" height="150" fill="none" stroke="white" strokeWidth="2" />
                <rect x="350" y="50" width="300" height="150" fill="none" stroke="white" strokeWidth="2" />
                <rect x="100" y="250" width="550" height="100" fill="none" stroke="white" strokeWidth="2" />
                <text x="200" y="130" fill="white" fontSize="14" textAnchor="middle">Library</text>
                <text x="500" y="130" fill="white" fontSize="14" textAnchor="middle">Science Block</text>
                <text x="375" y="305" fill="white" fontSize="14" textAnchor="middle">Main Ground</text>
                {/* Mock students */}
                <circle cx="250" cy="100" r="5" fill="#4ade80" className="animate-pulse" />
                <circle cx="450" cy="150" r="5" fill="#4ade80" className="animate-pulse" />
                <circle cx="600" cy="100" r="5" fill="#4ade80" className="animate-pulse" />
                <circle cx="150" cy="280" r="5" fill="#f87171" className="animate-pulse" />
              </svg>
              <div className="absolute top-4 right-4 bg-black/80 px-3 py-1 rounded text-xs border border-white/10 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" /> 842 Checked In
              </div>
            </div>
          </div>
          <div className="liquid-glass border border-white/10 rounded-2xl p-6">
            <h2 className="text-sm font-semibold tracking-wider text-gray-400 mb-4 uppercase">Class Schedule & Density</h2>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="bg-white/10 p-2 rounded">09:00 - 10:00<br /><span className="text-green-400">Low Density</span></div>
              <div className="bg-white/10 p-2 rounded">11:00 - 12:00<br /><span className="text-amber-400">Med Density</span></div>
              <div className="bg-white/10 p-2 rounded">13:00 - 14:00<br /><span className="text-red-400">High Density</span></div>
              <div className="bg-white/10 p-2 rounded">15:00 - 16:00<br /><span className="text-green-400">Low Density</span></div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="liquid-glass border border-white/10 rounded-2xl p-6">
            <h2 className="text-sm font-semibold tracking-wider text-gray-400 mb-4 uppercase">Request Safe Walk</h2>
            <p className="text-xs text-gray-400 mb-4">Request a campus security guard to escort you to your dorm or vehicle.</p>
            <button onClick={() => toast.success('Guard requested. ETA 2 minutes.')} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
              <ShieldAlert size={18} /> Request Guard Escort
            </button>
          </div>

          <div className="liquid-glass border border-white/10 rounded-2xl p-6 flex-1 flex flex-col overflow-hidden">
            <h2 className="text-sm font-semibold tracking-wider text-gray-400 mb-4 uppercase flex items-center justify-between">
              Campus Alerts <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded">LIVE</span>
            </h2>
            <div className="flex-1 overflow-y-auto space-y-3" style={{ scrollbarWidth: 'none' }}>
              <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
                <div className="text-xs text-red-400 font-medium mb-1">Unauthorized Entry Detected</div>
                <div className="text-[10px] text-gray-400">Gate 4 - Auto locked down.</div>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl">
                <div className="text-xs text-amber-400 font-medium mb-1">Lab Smoke Alarm</div>
                <div className="text-[10px] text-gray-400">Science Block Room 302. Evacuating.</div>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl">
                <div className="text-xs text-blue-400 font-medium mb-1">Lost Student Found</div>
                <div className="text-[10px] text-gray-400">ID: ST-8492 located at Library.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


// --- MAIN PAGE COMPONENT ---
export const AdvancedSettings: React.FC = () => {
  const [isCampusMode, setIsCampusMode] = useState(false);
  const [isRuralMode, setIsRuralMode] = useState(false);
  const [isFIRMode, setIsFIRMode] = useState(false);

  // Drone State
  const [isRecording, setIsRecording] = useState(false);

  // Wearable State (Removed from UI)
  /*
  const [heartRate, setHeartRate] = useState(75);
  useEffect(() => {
    const t = setInterval(() => {
      setHeartRate(() => {
        if (Math.random() > 0.9) return Math.floor(Math.random() * 20) + 125; // Spike
        return 72 + Math.floor(Math.random() * 8); // Normal
      });
    }, 3000);
    return () => clearInterval(t);
  }, []);
  */

  // Smart City APIs State
  const INITIAL_APIS = [
    { id: 1, name: 'Traffic Management', status: 'connected', time: 'Just now', icon: Car },
    { id: 2, name: 'Municipal CCTV', status: 'connected', time: '1m ago', icon: Video },
    { id: 3, name: 'Public Transport', status: 'degraded', time: '5m ago', icon: Bus },
    { id: 4, name: 'Weather Station', status: 'connected', time: 'Just now', icon: Wind },
    { id: 5, name: 'Power Grid', status: 'connected', time: '12s ago', icon: Zap },
    { id: 6, name: 'Water Sensors', status: 'offline', time: '2h ago', icon: Droplets },
    { id: 7, name: 'Hospital Beds', status: 'connected', time: '1m ago', icon: Heart },
    { id: 8, name: 'Emergency Broadcast', status: 'connected', time: 'Just now', icon: ShieldAlert },
  ];

  const [apis, setApis] = useState(INITIAL_APIS);
  const [testingApiId, setTestingApiId] = useState<number | null>(null);
  const [liveFeedLogs, setLiveFeedLogs] = useState<{ time: string, msg: string }[]>([
    { time: new Date().toLocaleTimeString(), msg: 'System initialized. Listening to streams...' }
  ]);

  const testConnection = (id: number) => {
    setTestingApiId(id);
    setTimeout(() => {
      setApis(prev => prev.map(api => api.id === id ? { ...api, status: 'connected', time: 'Just now' } : api));
      setTestingApiId(null);
      setLiveFeedLogs(prev => [{ time: new Date().toLocaleTimeString(), msg: `Successfully pinged API ID ${id}` }, ...prev].slice(0, 10));
      toast.success('Connection verified');
    }, 1500);
  };

  useEffect(() => {
    const t = setInterval(() => {
      const msgList = ['Traffic jam cleared at Hebbal', 'Camera 423 feed restored', 'Weather warning: Heavy rain incoming', 'Grid voltage spike detected'];
      setLiveFeedLogs(prev => [{ time: new Date().toLocaleTimeString(), msg: msgList[Math.floor(Math.random() * msgList.length)] }, ...prev].slice(0, 10));
    }, 8000);
    return () => clearInterval(t);
  }, []);

  if (isRuralMode) return <RuralEmergencyMode onExit={() => setIsRuralMode(false)} />;
  if (isCampusMode) return <CampusSafetyMode onExit={() => setIsCampusMode(false)} />;
  if (isFIRMode) return <AutoFIRGenerator onExit={() => setIsFIRMode(false)} />;

  return (
    <div className="flex flex-col w-full text-white min-h-screen pb-20">
      <Toaster position="top-right" toastOptions={{ style: { background: '#1a1a1a', border: '1px solid #333', color: '#fff' } }} />

      <div className="mb-10">
        <AnimatedHeading text={"Advanced\nCapabilities."} className="text-3xl md:text-4xl lg:text-5xl font-normal mb-2 tracking-[-0.04em] leading-tight" />
        <FadeIn delay={200}>
          <p className="text-sm md:text-base text-gray-400">Drone surveillance, wearables, AI chatbot, FIR generation, and deepfake detection.</p>
        </FadeIn>
      </div>

      <div className="grid grid-cols-1 gap-8 mb-8">

        {/* DRONE SURVEILLANCE PANEL */}
        <FadeIn delay={300} className="flex flex-col gap-6">
          <div className="liquid-glass border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-black/40">
              <h2 className="text-sm font-semibold tracking-wider flex items-center gap-2"><Crosshair size={16} className="text-teal-400" /> DRONE SURVEILLANCE</h2>
            </div>

            {/* Primary Feed */}
            <div className="relative w-full h-[300px] bg-black overflow-hidden flex items-center justify-center group border-b border-white/10">
              {/* Scanline Animation */}
              <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(to_bottom,transparent,rgba(255,255,255,0.4),transparent)] animate-[scanline_2s_linear_infinite]" style={{ backgroundSize: '100% 3px' }} />

              {/* Green SVG Crosshair */}
              <svg className="absolute w-32 h-32 text-teal-500/50" viewBox="0 0 100 100">
                <line x1="50" y1="20" x2="50" y2="40" stroke="currentColor" strokeWidth="1" />
                <line x1="50" y1="60" x2="50" y2="80" stroke="currentColor" strokeWidth="1" />
                <line x1="20" y1="50" x2="40" y2="50" stroke="currentColor" strokeWidth="1" />
                <line x1="60" y1="50" x2="80" y2="50" stroke="currentColor" strokeWidth="1" />
                <circle cx="50" cy="50" r="10" stroke="currentColor" strokeWidth="1" fill="none" />
              </svg>

              {/* Fake Feed Content */}
              <div className="absolute inset-0 opacity-40 bg-gradient-to-br from-teal-900/60 via-black to-emerald-900/40" />

              {/* Overlays */}
              <div className="absolute top-4 left-4 bg-black/80 px-3 py-1 rounded text-[10px] font-mono border border-white/20 text-white flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> LIVE FEED — DRONE 01
              </div>

              <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
                <div className="bg-black/80 px-3 py-1 rounded text-[10px] font-mono border border-white/20 text-teal-400">ALT: 124m</div>
                <div className="bg-black/80 px-3 py-1 rounded text-[10px] font-mono border border-white/20 text-green-400 flex items-center gap-1"><Battery size={10} /> 84%</div>
              </div>

              {/* Controls */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/80 p-2 rounded-xl border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="grid grid-cols-3 gap-1">
                  <div />
                  <button className="liquid-glass rounded-lg p-1.5 hover:bg-white/20"><ArrowUp size={14} /></button>
                  <div />
                  <button className="liquid-glass rounded-lg p-1.5 hover:bg-white/20"><ArrowLeft size={14} /></button>
                  <button className="liquid-glass rounded-lg p-1.5 hover:bg-white/20"><ArrowDown size={14} /></button>
                  <button className="liquid-glass rounded-lg p-1.5 hover:bg-white/20"><ArrowRight size={14} /></button>
                </div>
                <div className="w-px h-8 bg-white/20" />
                <input type="range" className="w-24 accent-teal-500" title="Zoom" />
                <div className="w-px h-8 bg-white/20" />
                <button onClick={() => setIsRecording(!isRecording)} className={`liquid-glass rounded-lg p-2 flex items-center gap-2 transition-colors ${isRecording ? 'bg-red-500/20 text-red-400 border-red-500/50' : 'hover:bg-white/20'}`}>
                  <Video size={14} className={isRecording ? 'animate-pulse' : ''} /> {isRecording ? 'REC' : 'Record'}
                </button>
              </div>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Drone Fleet */}
              <div className="space-y-3">
                {[1, 2, 3].map(id => (
                  <div key={id} className="liquid-glass border border-white/10 rounded-lg p-3 flex justify-between items-center text-xs hover:bg-white/5 transition-colors">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-white flex items-center gap-2">
                        <Crosshair size={12} className={id === 1 ? 'text-teal-400' : 'text-gray-500'} /> DRONE 0{id}
                      </span>
                      <span className="text-gray-400 font-mono text-[10px]">BAT: {100 - id * 15}% | ALT: {120 - id * 10}m</span>
                    </div>
                    <button className="bg-white/10 hover:bg-white/20 transition-colors px-3 py-1.5 rounded text-white">View</button>
                  </div>
                ))}
              </div>

              {/* Mini Map */}
              <div className="h-full min-h-[150px] rounded-lg overflow-hidden border border-white/10 relative z-0">
                <MapContainer center={[12.9716, 77.5946]} zoom={13} style={{ height: '100%', width: '100%', background: '#0a0a0a' }} zoomControl={false}>
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                  <Polyline
                    positions={[[12.9716, 77.5946], [12.98, 77.60], [12.99, 77.61]]}
                    pathOptions={{ color: '#2dd4bf', weight: 2, dashArray: '5, 5', className: 'animate-pulse' }}
                  />
                  <Marker position={[12.99, 77.61]} />
                </MapContainer>
              </div>
            </div>
          </div>
        </FadeIn>

      </div>

      {/* DEEPFAKE DETECTOR REMOVED */}

      {/* SMART CITY INTEGRATION APIs */}
      <FadeIn delay={700}>
        <div className="liquid-glass border border-white/10 rounded-2xl p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h2 className="text-lg font-medium flex items-center gap-2"><SettingsIcon size={20} className="text-purple-400" /> Smart City Integration APIs</h2>
            <span className="text-xs bg-purple-500/20 text-purple-400 px-3 py-1.5 rounded-full border border-purple-500/30 font-mono uppercase tracking-wider flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" /> Live Polling
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {apis.map(api => {
                const Icon = api.icon;
                const isTesting = testingApiId === api.id;
                return (
                  <div key={api.id} className="liquid-glass border border-white/10 rounded-xl p-4 flex flex-col gap-3 hover:bg-white/5 transition-colors">
                    <div className="flex justify-between items-start">
                      <Icon size={18} className="text-gray-400" />
                      <div className={`w-2 h-2 rounded-full ${api.status === 'connected' ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : api.status === 'degraded' ? 'bg-amber-500 shadow-[0_0_8px_#f59e0b]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'}`} />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-white line-clamp-1">{api.name}</h3>
                      <div className="text-[10px] text-gray-500 mt-0.5 font-mono">Last Data: {api.time}</div>
                    </div>
                    <button
                      onClick={() => testConnection(api.id)}
                      disabled={isTesting}
                      className="mt-auto w-full bg-white/5 hover:bg-white/10 transition-colors py-2 rounded text-xs text-gray-300 flex items-center justify-center gap-2 border border-white/5"
                    >
                      {isTesting ? <RefreshCw size={12} className="animate-spin" /> : null}
                      {isTesting ? 'Pinging...' : 'Test Connection'}
                    </button>
                  </div>
                )
              })}
            </div>

            <div className="liquid-glass border border-white/10 rounded-xl p-4 flex flex-col overflow-hidden h-[300px] lg:h-auto">
              <h3 className="text-xs font-semibold tracking-wider text-gray-500 uppercase mb-3 border-b border-white/10 pb-3">Live Data Feed</h3>
              <div className="flex-1 overflow-y-auto space-y-3 pr-1" style={{ scrollbarWidth: 'none' }}>
                {liveFeedLogs.map((log, i) => (
                  <div key={i} className="flex gap-3 text-xs animate-[fadeIn_0.3s_ease-out]">
                    <span className="text-purple-400 font-mono shrink-0">{log.time}</span>
                    <span className="text-gray-300">{log.msg}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </FadeIn>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
};
