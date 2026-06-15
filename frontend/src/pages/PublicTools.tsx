import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatedHeading } from '../components/AnimatedHeading';
import { FadeIn } from '../components/FadeIn';
import { 
  Phone, ShieldAlert, CheckCircle, Mic, MicOff, X,
  AlertTriangle, Camera, MapPin, Upload, Flame, Activity,
  Droplets, Users, Shield, Zap, ChevronRight, Crosshair
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { QRCodeSVG } from 'qrcode.react';

import toast, { Toaster } from 'react-hot-toast';
import { reportStore } from '../store/reportStore';
import type { ReportSeverity } from '../store/reportStore';

// Leaflet default icon fix
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const TABS = ['Nearby Finder', 'Crisis Report', 'Voice Assistant'];

const CRISIS_TYPES = [
  { label: 'Fire & Smoke',       icon: Flame,         color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30' },
  { label: 'Flood',              icon: Droplets,      color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/30' },
  { label: 'Violence / Assault', icon: ShieldAlert,   color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/30' },
  { label: 'Medical Emergency',  icon: Activity,      color: 'text-pink-400',   bg: 'bg-pink-500/10 border-pink-500/30' },
  { label: 'Crowd / Stampede',   icon: Users,         color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/30' },
  { label: 'Security Threat',    icon: Shield,        color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30' },
  { label: 'Power Outage',       icon: Zap,           color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30' },
  { label: 'Other',              icon: AlertTriangle, color: 'text-gray-400',   bg: 'bg-white/5 border-white/20' },
];

// --- Mock Data ---
const HOSPITALS = [
  { id: 1, name: 'Manipal Hospital', distance: '1.2 km', address: '98 HAL Old Airport Rd', phone: '080-2222-1111', open: true, coords: [12.959, 77.648] as [number, number] },
  { id: 2, name: 'Fortis Hospital', distance: '2.5 km', address: '154/9 Bannerghatta Road', phone: '080-6621-4444', open: true, coords: [12.894, 77.598] as [number, number] },
  { id: 3, name: 'Apollo Hospitals', distance: '3.1 km', address: '154/11 Bannerghatta Road', phone: '080-2630-4050', open: true, coords: [12.895, 77.599] as [number, number] },
  { id: 4, name: 'St. John\'s Medical', distance: '3.8 km', address: 'Sarjapur Road, Koramangala', phone: '080-2206-5003', open: true, coords: [12.929, 77.618] as [number, number] },
  { id: 5, name: 'Sakra World Hospital', distance: '5.0 km', address: 'Devarabeesanahalli Varthur Hobli', phone: '080-4969-4969', open: true, coords: [12.932, 77.684] as [number, number] },
  { id: 6, name: 'Bowring and Lady Curzon', distance: '5.2 km', address: 'Lady Curzon Rd, Shivaji Nagar', phone: '080-2559-1362', open: false, coords: [12.982, 77.602] as [number, number] },
];

const POLICE_STATIONS = [
  { id: 1, name: 'Indiranagar Police Station', distance: '0.8 km', address: '100 Feet Rd, Indiranagar', phone: '080-2294-2541', open: true, coords: [12.978, 77.640] as [number, number] },
  { id: 2, name: 'Koramangala Police', distance: '2.1 km', address: 'Koramangala 8th Block', phone: '080-2553-7777', open: true, coords: [12.938, 77.615] as [number, number] },
  { id: 3, name: 'Ashok Nagar Police', distance: '3.5 km', address: 'Shoppers Stop, MG Road', phone: '080-2294-2580', open: true, coords: [12.972, 77.608] as [number, number] },
  { id: 4, name: 'Halasuru Police Station', distance: '4.2 km', address: 'Old Madras Road', phone: '080-2557-4821', open: true, coords: [12.976, 77.625] as [number, number] },
  { id: 5, name: 'Viveknagar Police', distance: '4.8 km', address: 'Viveknagar Main Rd', phone: '080-2294-2584', open: true, coords: [12.955, 77.619] as [number, number] },
  { id: 6, name: 'Cubbon Park Police', distance: '5.5 km', address: 'Kasturba Road', phone: '080-2294-2591', open: true, coords: [12.977, 77.596] as [number, number] },
];

const LocationPicker: React.FC<{
  coords: [number, number] | null;
  setCoords: (coords: [number, number]) => void;
}> = ({ coords, setCoords }) => {
  useMapEvents({
    click(e) {
      setCoords([e.latlng.lat, e.latlng.lng]);
    }
  });
  return coords ? <Marker position={coords} /> : null;
};

export const PublicTools: React.FC = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get('tab') === 'report' ? 'Crisis Report' : TABS[0];
  });

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('tab') === 'report') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab('Crisis Report');
    }
  }, [location.search]);

  // --- NEARBY FINDER STATE ---
  const [finderType, setFinderType] = useState<'Hospitals' | 'Police Stations'>('Hospitals');
  const finderData = finderType === 'Hospitals' ? HOSPITALS : POLICE_STATIONS;

  // (Contact Vault State Removed)

  // --- ANONYMOUS REPORT STATE ---
  const [reportCoords, setReportCoords] = useState<[number, number] | null>(null);
  const [urgency, setUrgency] = useState('Medium');
  const [reportSubmitted, setReportSubmitted] = useState<string | null>(null);

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setReportSubmitted(`CASE_${Math.floor(Math.random() * 10000)}`);
    toast.success('Anonymous report filed securely.');
  };

  // --- CRISIS REPORT STATE ---
  const [crisisStep, setCrisisStep] = useState(1);
  const [crisisType, setCrisisType] = useState('');
  const [crisisDesc, setCrisisDesc] = useState('');
  const [crisisLocation, setCrisisLocation] = useState('');
  const [crisisCoords, setCrisisCoords] = useState<[number, number] | null>(null);
  const [crisisSeverity, setCrisisSeverity] = useState<ReportSeverity>('Medium');
  const [crisisAnon, setCrisisAnon] = useState(true);
  const [crisisName, setCrisisName] = useState('');
  const [crisisMediaNames, setCrisisMediaNames] = useState<string[]>([]);
  const [crisisSubmitted, setCrisisSubmitted] = useState<{ caseRef: string; type: string; description: string; location: string; severity: string; reportedAt: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const baseTextRef = useRef('');
  const [detectingLoc, setDetectingLoc] = useState(false);

  // Auto-detect location on mount
  useEffect(() => {
    if (crisisCoords || crisisLocation) return;
    detectCrisisLocation();
  }, []);

  const detectCrisisLocation = () => {
    if (!navigator.geolocation) return;
    setDetectingLoc(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCrisisCoords([lat, lng]);
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&accept-language=en`);
          const data = await res.json();
          const addr = data.address;
          const readable = [addr?.road, addr?.suburb, addr?.city || addr?.town].filter(Boolean).join(', ');
          if (readable) setCrisisLocation(readable);
          else setCrisisLocation(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        } catch {
          setCrisisLocation(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        }
        setDetectingLoc(false);
        toast.success('Location detected');
      },
      () => { setDetectingLoc(false); },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const toggleDictation = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { toast.error('Speech recognition not supported.'); return; }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    baseTextRef.current = crisisDesc;
    const recognition = new SR();
    recognition.lang = 'en-IN';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognitionRef.current = recognition;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      let full = '';
      for (let i = 0; i < event.results.length; i++) {
        full += event.results[i][0].transcript;
        if (event.results[i].isFinal) full += ' ';
      }
      const base = baseTextRef.current;
      setCrisisDesc((base ? base.trimEnd() + ' ' : '') + full.trim());
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const names = files.map(f => f.name);
    setCrisisMediaNames(prev => [...prev, ...names].slice(0, 5));
    toast.success(`${files.length} file(s) attached`);
  };

  const handleCrisisSubmit = () => {
    if (!crisisType) { toast.error('Please select a crisis type.'); return; }
    if (!crisisDesc.trim()) { toast.error('Please provide a description.'); return; }
    const report = reportStore.add({
      type: crisisType,
      description: crisisDesc,
      location: crisisLocation || (crisisCoords ? `${crisisCoords[0].toFixed(4)}, ${crisisCoords[1].toFixed(4)}` : 'Unknown'),
      coords: crisisCoords,
      severity: crisisSeverity,
      anonymous: crisisAnon,
      reporterName: crisisAnon ? undefined : crisisName,
      media: crisisMediaNames,
    });
    const loc = crisisLocation || (crisisCoords ? `${crisisCoords[0].toFixed(4)}, ${crisisCoords[1].toFixed(4)}` : 'Unknown');
    setCrisisSubmitted({
      caseRef: report.caseRef,
      type: crisisType,
      description: crisisDesc,
      location: loc,
      severity: crisisSeverity,
      reportedAt: new Date().toLocaleString(),
    });
    toast.success('Crisis report submitted — visible in Admin Panel now!');
  };

  const resetCrisis = () => {
    setCrisisStep(1); setCrisisType(''); setCrisisDesc(''); setCrisisLocation('');
    setCrisisCoords(null); setCrisisSeverity('Medium'); setCrisisAnon(true);
    setCrisisName(''); setCrisisMediaNames([]); setCrisisSubmitted(null);
  };

  // --- VOICE ASSISTANT STATE ---
  const [voiceAction, setVoiceAction] = useState<string | null>(null);
  const [voiceListening, setVoiceListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const voiceRecRef = useRef<any>(null);

  const handleVoiceCommand = (msg: string) => {
    setVoiceAction(msg);
    const u = new SpeechSynthesisUtterance(msg);
    window.speechSynthesis.speak(u);
  };

  const voiceCommands: { pattern: RegExp; response: string }[] = [
    { pattern: /nearest hospital/i, response: 'Locating the nearest hospital. Preparing directions.' },
    { pattern: /call police/i, response: 'Calling police. Connecting you to dispatch.' },
    { pattern: /activate sos/i, response: 'SOS Activated. Broadcasting your location to emergency contacts.' },
    { pattern: /safe route/i, response: 'Calculating safest route home avoiding reported hazard zones.' },
  ];

  const toggleListen = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { toast.error('Speech recognition not supported.'); return; }

    if (voiceListening && voiceRecRef.current) {
      voiceRecRef.current.stop();
      setVoiceListening(false);
      return;
    }

    const recognition = new SR();
    recognition.lang = 'en-IN';
    recognition.continuous = true;
    recognition.interimResults = false;
    voiceRecRef.current = recognition;

    recognition.onstart = () => { setVoiceListening(true); setVoiceTranscript(''); setVoiceAction(null); };
    recognition.onresult = (event: any) => {
      const last = event.results[event.results.length - 1];
      if (last.isFinal) {
        const text = last[0].transcript;
        setVoiceTranscript(text);
        const matched = voiceCommands.find(c => c.pattern.test(text));
        if (matched) {
          handleVoiceCommand(matched.response);
        } else {
          setVoiceAction(`Command not recognized: "${text}". Try: "nearest hospital", "call police", "activate SOS", or "safe route home".`);
        }
      }
    };
    recognition.onerror = () => setVoiceListening(false);
    recognition.onend = () => setVoiceListening(false);
    recognition.start();
  };

  return (
    <div className="flex flex-col w-full text-white min-h-screen relative pb-20">
      <Toaster position="top-right" toastOptions={{ style: { background: '#1a1a1a', border: '1px solid #333', color: '#fff' } }} />

      <div className="mb-8">
        <AnimatedHeading text={"Public\nTools."} className="text-3xl md:text-4xl lg:text-5xl font-normal mb-2 tracking-[-0.04em] leading-tight" />
        <FadeIn delay={200}>
          <p className="text-sm md:text-base text-gray-400">Emergency finders, anonymous reporting, contact vault, and voice guidance.</p>
        </FadeIn>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto mb-8 pb-2 custom-scrollbar">
        {TABS.map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)} 
            className={`shrink-0 border rounded-lg px-5 py-2.5 text-sm font-semibold transition-all ${
              activeTab === tab
                ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                : 'bg-white/[0.08] border-white/30 text-white hover:bg-white/20 hover:border-white/60'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* --- TAB CONTENT --- */}
      
      {activeTab === 'Nearby Finder' && (
        <FadeIn>
          <div className="flex gap-2 mb-6">
            {['Hospitals', 'Police Stations'].map(type => (
              <button 
                key={type}
                onClick={() => setFinderType(type as any)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all border ${
                  finderType === type
                    ? 'bg-blue-500 text-white border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                    : 'bg-white/[0.08] border-white/30 text-white hover:bg-white/20'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 flex flex-col gap-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {finderData.map(loc => (
                <div key={loc.id} className="liquid-glass border border-white/10 rounded-xl p-4 flex flex-col gap-3">
                  {/* Name + distance */}
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="text-base font-semibold text-white leading-tight">{loc.name}</h3>
                    <span className="text-[10px] px-2 py-1 bg-white/10 rounded-md font-mono text-white shrink-0 border border-white/10">{loc.distance}</span>
                  </div>
                  <div className="flex flex-col gap-1.5 mt-1">
                    {/* Address */}
                    <p className="text-sm text-gray-200 leading-relaxed">{loc.address}</p>
                    {/* Phone number */}
                    <a 
                      href={`tel:${loc.phone}`} 
                      className="text-sm font-medium text-blue-400 hover:text-blue-300 flex items-center gap-2 transition-colors"
                    >
                      <Phone size={14} className="text-blue-400" />
                      {loc.phone}
                    </a>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="lg:col-span-2 h-[400px] lg:h-[600px] rounded-xl overflow-hidden border border-white/10 relative z-0">
               <MapContainer center={[12.9716, 77.5946]} zoom={12} style={{ height: '100%', width: '100%', background: '#0a0a0a' }}>
                 <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                 {finderData.map(loc => (
                   <Marker key={loc.id} position={loc.coords} />
                 ))}
               </MapContainer>
            </div>
          </div>
        </FadeIn>
      )}

      {/* Contact Vault Removed */}

      {/* ══ CRISIS REPORT TAB ══ */}
      {activeTab === 'Crisis Report' && (
        <FadeIn>
          {crisisSubmitted ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center gap-6">
              <div className="w-20 h-20 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center">
                <CheckCircle size={40} className="text-green-400" />
              </div>
              <div>
                <h3 className="text-2xl font-light mb-2 text-white">Report Submitted</h3>
                <p className="text-gray-400 text-sm max-w-sm">Your report has been filed and is now visible to admins in real-time. Save your case reference below.</p>
              </div>
              <div className="bg-white p-4 rounded-xl">
                <QRCodeSVG value={[
                  'RAKSHA NEXUS - CRISIS REPORT',
                  '',
                  `Case: ${crisisSubmitted.caseRef}`,
                  `Type: ${crisisSubmitted.type}`,
                  `Severity: ${crisisSubmitted.severity}`,
                  `Location: ${crisisSubmitted.location}`,
                  `Description: ${crisisSubmitted.description}`,
                  `Reported: ${crisisSubmitted.reportedAt}`,
                  'Status: Pending'
                ].join('\n')} size={140} />
              </div>
              <div className="text-2xl font-mono tracking-widest bg-white/5 border border-white/10 px-8 py-4 rounded-xl text-white">
                {crisisSubmitted.caseRef}
              </div>
              <div className="flex gap-3">
                <button onClick={resetCrisis} className="bg-white/10 hover:bg-white/20 transition-colors px-6 py-2.5 rounded-xl text-sm border border-white/10 text-white">
                  Submit Another
                </button>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto">
              {/* Progress Steps */}
              <div className="flex items-center gap-2 mb-8">
                {[1,2,3].map((s, i) => (
                  <React.Fragment key={s}>
                    <div className={`flex items-center gap-2 text-xs font-medium transition-colors ${
                      crisisStep >= s ? 'text-white' : 'text-gray-600'
                    }`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                        crisisStep > s ? 'bg-green-500 border-green-500 text-black' :
                        crisisStep === s ? 'bg-white border-white text-black' :
                        'bg-transparent border-white/20 text-gray-600'
                      }`}>
                        {crisisStep > s ? '✓' : s}
                      </div>
                      <span className="hidden sm:inline">{['Incident Details', 'Location & Media', 'Confirm & Submit'][i]}</span>
                    </div>
                    {i < 2 && <div className={`flex-1 h-px transition-colors ${crisisStep > s ? 'bg-green-500' : 'bg-white/10'}`} />}
                  </React.Fragment>
                ))}
              </div>

              {/* Step 1 — Incident Details */}
              {crisisStep === 1 && (
                <FadeIn className="space-y-6">
                  <div>
                    <label className="block text-xs text-gray-400 uppercase tracking-wider mb-4">Select Crisis Type</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {CRISIS_TYPES.map(ct => (
                        <button
                          key={ct.label}
                          type="button"
                          onClick={() => setCrisisType(ct.label)}
                          className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center ${
                            crisisType === ct.label
                              ? ct.bg + ' ' + ct.color
                              : 'border-white/10 text-gray-400 hover:border-white/30 hover:bg-white/5'
                          }`}
                        >
                          <ct.icon size={22} />
                          <span className="text-xs font-medium leading-tight">{ct.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Description</label>
                    <div className="relative">
                      <textarea
                        rows={4}
                        value={crisisDesc}
                        onChange={e => setCrisisDesc(e.target.value)}
                        placeholder="Describe what is happening in detail — number of people affected, timeline, visible hazards..."
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 pr-12 text-sm text-white focus:outline-none focus:border-white/30 resize-none"
                      />
                      <button
                        type="button"
                        onClick={toggleDictation}
                        className={`absolute right-2 top-2 p-2 rounded-lg transition-all ${
                          isListening
                            ? 'bg-red-500/20 border border-red-500/50 text-red-400 animate-pulse'
                            : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                        }`}
                        title={isListening ? 'Stop dictation' : 'Start voice dictation'}
                      >
                        {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                      </button>
                    </div>
                    {isListening && (
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-[10px] text-red-400 font-mono">Recording — tap mic to stop</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 uppercase tracking-wider mb-3">Severity Level</label>
                    <div className="grid grid-cols-4 gap-2">
                      {(['Low','Medium','High','Critical'] as ReportSeverity[]).map(level => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setCrisisSeverity(level)}
                          className={`py-2.5 rounded-xl text-xs font-bold tracking-wider border-2 transition-all ${
                            crisisSeverity === level
                              ? level === 'Critical' ? 'bg-red-600 border-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                              : level === 'High'     ? 'bg-orange-500/30 border-orange-500 text-orange-300'
                              : level === 'Medium'   ? 'bg-amber-500/30 border-amber-500 text-amber-300'
                              :                        'bg-blue-500/30 border-blue-500 text-blue-300'
                              : 'border-white/10 text-gray-500 hover:border-white/30'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (!crisisType) { toast.error('Select a crisis type'); return; }
                      if (!crisisDesc.trim()) { toast.error('Add a description'); return; }
                      setCrisisStep(2);
                    }}
                    className="w-full bg-white text-black font-bold py-3.5 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                  >
                    Continue <ChevronRight size={16} />
                  </button>
                </FadeIn>
              )}

              {/* Step 2 — Location & Media */}
              {crisisStep === 2 && (
                <FadeIn className="space-y-6">
                  <div>
                    <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Location Description</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={crisisLocation}
                        onChange={e => setCrisisLocation(e.target.value)}
                        placeholder="e.g. MG Road near Metro Station, or leave blank to use map pin"
                        className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/30"
                      />
                      <button
                        type="button"
                        onClick={detectCrisisLocation}
                        disabled={detectingLoc}
                        className="shrink-0 bg-white/5 border border-white/10 rounded-xl px-3 flex items-center gap-1.5 text-gray-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
                        title="Auto-detect location"
                      >
                        <Crosshair size={14} className={detectingLoc ? 'animate-spin' : ''} />
                        <span className="text-[10px] font-mono">{detectingLoc ? 'Detecting...' : 'Detect'}</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 flex justify-between">
                      <span>Pin on Map <span className="normal-case text-gray-600">(optional)</span></span>
                      {crisisCoords && <span className="text-green-400">📍 {crisisCoords[0].toFixed(4)}, {crisisCoords[1].toFixed(4)}</span>}
                    </label>
                    <div className="h-[280px] rounded-xl overflow-hidden border border-white/10 relative z-0">
                      <MapContainer center={[12.9716, 77.5946]} zoom={12} style={{ height: '100%', width: '100%', background: '#0a0a0a' }}>
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                        <LocationPicker coords={crisisCoords} setCoords={setCrisisCoords} />
                      </MapContainer>
                      {!crisisCoords && (
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-[400] bg-black/20">
                          <span className="bg-black/80 text-white px-4 py-2 rounded-full text-xs border border-white/10 flex items-center gap-2">
                            <MapPin size={12} /> Click map to pin location
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Attach Media (Photos/Videos)</label>
                    <input ref={fileRef} type="file" accept="image/*,video/*" multiple onChange={handleMediaUpload} className="hidden" />
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="w-full border-2 border-dashed border-white/20 rounded-xl py-6 flex flex-col items-center gap-2 text-gray-400 hover:border-white/40 hover:bg-white/5 transition-all"
                    >
                      <Upload size={24} />
                      <span className="text-sm">Click to upload photos or videos</span>
                      <span className="text-xs text-gray-600">JPG, PNG, MP4 — max 5 files</span>
                    </button>
                    {crisisMediaNames.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {crisisMediaNames.map((n, i) => (
                          <div key={i} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-300">
                            <Camera size={12} className="text-blue-400" /> {n}
                            <button onClick={() => setCrisisMediaNames(p => p.filter((_, j) => j !== i))}><X size={10} /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setCrisisStep(1)} className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-medium transition-colors">
                      Back
                    </button>
                    <button onClick={() => setCrisisStep(3)} className="flex-[2] bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                      Continue <ChevronRight size={16} />
                    </button>
                  </div>
                </FadeIn>
              )}

              {/* Step 3 — Review & Submit */}
              {crisisStep === 3 && (
                <FadeIn className="space-y-6">
                  <div className="liquid-glass border border-white/10 rounded-2xl p-6 space-y-4">
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Review Your Report</h3>
                    
                    {[['Crisis Type', crisisType], ['Description', crisisDesc], ['Severity', crisisSeverity],
                      ['Location', crisisLocation || (crisisCoords ? `${crisisCoords[0].toFixed(4)}, ${crisisCoords[1].toFixed(4)}` : 'Not specified')],
                      ['Media', crisisMediaNames.length > 0 ? `${crisisMediaNames.length} file(s) attached` : 'None'],
                    ].map(([label, value]) => (
                      <div key={label} className="flex gap-4 text-sm border-b border-white/5 pb-3">
                        <span className="text-gray-500 w-28 shrink-0">{label}</span>
                        <span className={`text-white ${
                          label === 'Severity'
                            ? value === 'Critical' ? 'text-red-400 font-bold' : value === 'High' ? 'text-orange-400 font-bold' : value === 'Medium' ? 'text-amber-400' : 'text-blue-400'
                            : ''
                        }`}>{value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="liquid-glass border border-white/10 rounded-2xl p-6">
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Identity</h3>
                    <div className="flex gap-3 mb-4">
                      <button
                        onClick={() => setCrisisAnon(true)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                          crisisAnon ? 'bg-white/10 border-white text-white' : 'border-white/10 text-gray-500 hover:border-white/30'
                        }`}
                      >
                        🔒 Stay Anonymous
                      </button>
                      <button
                        onClick={() => setCrisisAnon(false)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                          !crisisAnon ? 'bg-white/10 border-white text-white' : 'border-white/10 text-gray-500 hover:border-white/30'
                        }`}
                      >
                        👤 Provide Name
                      </button>
                    </div>
                    {!crisisAnon && (
                      <input
                        type="text"
                        value={crisisName}
                        onChange={e => setCrisisName(e.target.value)}
                        placeholder="Your full name (optional)"
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/30"
                      />
                    )}
                    {crisisAnon && <p className="text-xs text-gray-500">Your IP and identity will be fully stripped before submission.</p>}
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setCrisisStep(2)} className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-medium transition-colors">
                      Back
                    </button>
                    <button
                      onClick={handleCrisisSubmit}
                      className="flex-[2] bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                    >
                      <ShieldAlert size={16} /> Submit Crisis Report
                    </button>
                  </div>
                  <p className="text-[10px] text-center text-gray-600">Reports are instantly forwarded to the emergency admin panel and on-duty officers.</p>
                </FadeIn>
              )}
            </div>
          )}
        </FadeIn>
      )}


      {activeTab === 'Anonymous Report' && (
        <FadeIn>
          <div className="max-w-4xl mx-auto">
            {reportSubmitted ? (
              <div className="liquid-glass border border-white/10 rounded-xl p-8 flex flex-col items-center justify-center text-center">
                <CheckCircle size={48} className="text-green-500 mb-4" />
                <h3 className="text-2xl font-light mb-2">Report Successfully Submitted</h3>
                <p className="text-gray-400 mb-6">Your identity has been fully anonymized. Please save your case number and QR code for future reference.</p>
                
                <div className="bg-white p-4 rounded-xl mb-6">
                  <QRCodeSVG value={reportSubmitted} size={150} />
                </div>
                
                <div className="text-xl font-mono tracking-widest bg-white/5 border border-white/10 px-6 py-3 rounded-lg mb-8">
                  {reportSubmitted}
                </div>
                
                <button 
                  onClick={() => { setReportSubmitted(null); setReportCoords(null); }}
                  className="bg-white/10 hover:bg-white/20 transition-colors px-6 py-2.5 rounded-lg text-sm border border-white/5"
                >
                  Submit Another Report
                </button>
              </div>
            ) : (
              <div className="liquid-glass border border-white/10 rounded-xl p-6 md:p-8">
                <h2 className="text-xl font-medium mb-6 flex items-center gap-2"><ShieldAlert className="text-red-400"/> File Anonymous Report</h2>
                
                <form onSubmit={handleReportSubmit} className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm text-gray-400">Incident Type</label>
                    <select required className="bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-white/30">
                      <option value="">Select Type...</option>
                      <option>Harassment</option>
                      <option>Accident / Medical</option>
                      <option>Suspicious Activity</option>
                      <option>Violence / Assault</option>
                      <option>Infrastructure Hazard</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm text-gray-400">Description</label>
                    <textarea required rows={4} placeholder="Describe what you witnessed in detail..." className="bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-white/30 resize-none" />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm text-gray-400 flex justify-between">
                      <span>Pin Location on Map</span>
                      {reportCoords && <span className="text-green-400 text-xs">Coordinates set</span>}
                    </label>
                    <div className="h-[250px] w-full rounded-lg overflow-hidden border border-white/10 relative z-0">
                      <MapContainer center={[12.9716, 77.5946]} zoom={12} style={{ height: '100%', width: '100%', background: '#0a0a0a' }}>
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                        <LocationPicker coords={reportCoords} setCoords={setReportCoords} />
                      </MapContainer>
                      {!reportCoords && (
                         <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-[400] bg-black/20 backdrop-blur-[1px]">
                            <span className="bg-black/80 text-white px-4 py-2 rounded-full text-xs border border-white/10">Click map to pin location</span>
                         </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <label className="text-sm text-gray-400">Urgency Level</label>
                    <div className="flex gap-2">
                      {['Low', 'Medium', 'High'].map(level => (
                        <button 
                          key={level}
                          type="button"
                          onClick={() => setUrgency(level)}
                          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all border ${
                            urgency === level 
                              ? (level === 'High' ? 'bg-red-500/20 text-red-400 border-red-500/50' : level === 'Medium' ? 'bg-amber-500/20 text-amber-400 border-amber-500/50' : 'bg-blue-500/20 text-blue-400 border-blue-500/50')
                              : 'bg-white/[0.06] border-white/20 text-white hover:bg-white/15'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 mt-2 border-t border-white/10">
                    <button type="submit" className="w-full bg-white text-black font-medium py-3.5 rounded-xl hover:bg-gray-200 transition-colors">
                      Submit Anonymously
                    </button>
                    <p className="text-[10px] text-center text-gray-500 mt-3">Your IP address and metadata are stripped before submission.</p>
                  </div>
                </form>
              </div>
            )}
          </div>
        </FadeIn>
      )}

      {activeTab === 'Voice Assistant' && (
        <FadeIn>
          <div className="flex flex-col items-center justify-center min-h-[500px] max-w-2xl mx-auto text-center gap-8">
            
            <div className="relative">
               {voiceListening && (
                 <>
                   <div className="absolute inset-0 bg-blue-500 rounded-full blur-[40px] opacity-20 animate-pulse" />
                   <div className="absolute inset-0 bg-purple-500 rounded-full blur-[60px] opacity-10 animate-ping" style={{ animationDuration: '3s' }} />
                 </>
               )}
               <button 
                 onClick={toggleListen}
                 className={`relative z-10 w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${
                   voiceListening ? 'bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.4)] scale-105' : 'liquid-glass border border-white/10 text-white hover:bg-white/5 hover:scale-105'
                 }`}
               >
                 {voiceListening ? <Mic size={48} /> : <MicOff size={48} />}
               </button>
            </div>

            <div className="flex flex-col gap-2 h-20">
               {voiceListening ? (
                 <>
                   <p className="text-xl font-light text-white animate-pulse">Listening...</p>
                   <p className="text-sm text-gray-400 italic">"{voiceTranscript || 'Say something like nearest hospital...'}"</p>
                 </>
               ) : (
                 <>
                   <p className="text-xl font-light text-gray-400">Tap microphone to start</p>
                   <p className="text-sm text-gray-600">Voice Assistant is sleeping</p>
                 </>
               )}
            </div>

            {voiceAction && (
              <FadeIn>
                <div className="liquid-glass border border-blue-500/30 bg-blue-500/5 rounded-xl p-6 flex flex-col gap-3 w-full max-w-md mx-auto">
                  <span className="text-xs font-mono text-blue-400 uppercase tracking-widest">Assistant Response</span>
                  <p className="text-lg font-medium text-white">{voiceAction}</p>
                </div>
              </FadeIn>
            )}

            <div className="w-full max-w-lg mx-auto pt-8 border-t border-white/10">
              <p className="text-xs text-gray-500 mb-4">TRY SAYING</p>
              <div className="flex flex-wrap justify-center gap-2">
                {['nearest hospital', 'call police', 'activate SOS', 'safe route home'].map(cmd => (
                  <span key={cmd} className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-gray-300">
                    "{cmd}"
                  </span>
                ))}
              </div>
            </div>

          </div>
        </FadeIn>
      )}

      {/* MODALS REMOVED */}

    </div>
  );
};
