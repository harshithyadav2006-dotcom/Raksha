import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  X, AlertTriangle, ChevronRight, ChevronLeft, Flame, Droplets,
  ShieldAlert, Activity, Users, Shield, Zap, MapPin, Upload,
  Camera, CheckCircle, ClipboardList, Mic, MicOff, Crosshair
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import { reportStore } from '../store/reportStore';
import type { ReportSeverity } from '../store/reportStore';

// Leaflet default icon fix
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const INCIDENT_TYPES = [
  { label: 'Fire & Smoke',       icon: Flame,         color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/40' },
  { label: 'Flood',              icon: Droplets,      color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/40' },
  { label: 'Violence / Assault', icon: ShieldAlert,   color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/40' },
  { label: 'Medical Emergency',  icon: Activity,      color: 'text-pink-400',   bg: 'bg-pink-500/10 border-pink-500/40' },
  { label: 'Crowd / Stampede',   icon: Users,         color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/40' },
  { label: 'Security Threat',    icon: Shield,        color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/40' },
  { label: 'Power Outage',       icon: Zap,           color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/40' },
  { label: 'Other',              icon: AlertTriangle, color: 'text-gray-400',   bg: 'bg-white/5 border-white/20' },
];

const STEP_LABELS = ['Incident Type', 'Details', 'Location & Media', 'Review'];

const LocationPicker: React.FC<{
  coords: [number, number] | null;
  setCoords: (c: [number, number]) => void;
}> = ({ coords, setCoords }) => {
  useMapEvents({ click(e) { setCoords([e.latlng.lat, e.latlng.lng]); } });
  return coords ? <Marker position={coords} /> : null;
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ReportIncidentModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1);
  const [incidentType, setIncidentType] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<ReportSeverity>('Medium');
  const [location, setLocation] = useState('');
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const [mediaNames, setMediaNames] = useState<string[]>([]);
  const [anonymous, setAnonymous] = useState(true);
  const [reporterName, setReporterName] = useState('');
  const [submitted, setSubmitted] = useState<{ caseRef: string; type: string; description: string; location: string; severity: string; reportedAt: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const baseTextRef = useRef('');
  const [detectingLocation, setDetectingLocation] = useState(false);

  // Auto-detect location when modal opens
  useEffect(() => {
    if (!isOpen) return;
    if (coords || location) return; // already set
    detectLocation();
  }, [isOpen]);

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) { toast.error('Geolocation not supported.'); return; }
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords([lat, lng]);
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&accept-language=en`);
          const data = await res.json();
          const addr = data.address;
          const readable = [addr?.road, addr?.suburb, addr?.city || addr?.town].filter(Boolean).join(', ');
          if (readable) setLocation(readable);
          else setLocation(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        } catch {
          setLocation(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        }
        setDetectingLocation(false);
        toast.success('Location detected');
      },
      () => { setDetectingLocation(false); },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [coords, location]);

  const toggleDictation = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Speech recognition not supported in this browser.');
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    // Capture current text as baseline before recording starts
    baseTextRef.current = description;

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      let full = '';
      for (let i = 0; i < event.results.length; i++) {
        full += event.results[i][0].transcript;
        if (event.results[i].isFinal) full += ' ';
      }
      const base = baseTextRef.current;
      setDescription((base ? base.trimEnd() + ' ' : '') + full.trim());
    };

    recognition.onerror = (event: any) => {
      console.error('Speech error:', event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        toast.error('Microphone access denied. Please allow mic permission.');
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  }, [isListening, description]);

  const reset = useCallback(() => {
    setStep(1);
    setIncidentType('');
    setDescription('');
    setSeverity('Medium');
    setLocation('');
    setCoords(null);
    setMediaNames([]);
    setAnonymous(true);
    setReporterName('');
    setSubmitted(null);
  }, []);

  const handleClose = () => { reset(); onClose(); };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setMediaNames(prev => [...prev, ...files.map(f => f.name)].slice(0, 5));
    toast.success(`${files.length} file(s) attached`);
  };

  const handleSubmit = () => {
    const report = reportStore.add({
      type: incidentType,
      description,
      location: location || (coords ? `${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}` : 'Unknown'),
      coords,
      severity,
      anonymous,
      reporterName: anonymous ? undefined : reporterName || undefined,
      media: mediaNames,
    });
    setSubmitted({
      caseRef: report.caseRef,
      type: incidentType,
      description,
      location: location || (coords ? `${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}` : 'Unknown'),
      severity,
      reportedAt: new Date().toLocaleString(),
    });
    toast.success('Incident reported — forwarded to response team.');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9990] bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal Panel — slides up from bottom */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[9991] flex justify-center"
        style={{ pointerEvents: 'none' }}
      >
        <div
          className="w-full max-w-2xl rounded-t-3xl overflow-hidden flex flex-col"
          style={{
            pointerEvents: 'all',
            background: 'rgba(8,8,12,0.95)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            boxShadow: '0 -4px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)',
            maxHeight: '92vh',
          }}
        >
          {/* Drag Handle */}
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                <ClipboardList size={16} className="text-red-400" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white tracking-wide">REPORT INCIDENT</h2>
                {!submitted && (
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                    Step {step} of {STEP_LABELS.length} — {STEP_LABELS[step - 1]}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all"
            >
              <X size={15} />
            </button>
          </div>

          {/* Progress bar */}
          {!submitted && (
            <div className="h-0.5 bg-white/5 shrink-0">
              <div
                className="h-full bg-gradient-to-r from-red-500 to-orange-400 transition-all duration-500"
                style={{ width: `${(step / STEP_LABELS.length) * 100}%` }}
              />
            </div>
          )}

          {/* Scrollable Content */}
          <div className="overflow-y-auto flex-1 px-6 py-5" style={{ scrollbarWidth: 'none' }}>

            {/* ── SUCCESS STATE ── */}
            {submitted ? (
              <div className="flex flex-col items-center text-center gap-5 py-6">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-green-500/30 blur-2xl animate-pulse" />
                  <div className="relative w-20 h-20 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center">
                    <CheckCircle size={38} className="text-green-400" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-light text-white mb-1">Report Submitted</h3>
                  <p className="text-sm text-gray-400 max-w-xs">
                    Your incident has been filed and forwarded to the response team in real-time.
                  </p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-lg">
                  <QRCodeSVG value={[
                    'RAKSHA NEXUS - INCIDENT REPORT',
                    '',
                    'Case: ' + submitted.caseRef,
                    'Type: ' + submitted.type,
                    'Severity: ' + submitted.severity,
                    'Location: ' + submitted.location,
                    'Description: ' + submitted.description,
                    'Reported: ' + submitted.reportedAt,
                    'Status: Pending'
                  ].join('\n')} size={120} />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Case Reference</p>
                  <div className="text-xl font-mono tracking-widest bg-white/5 border border-white/10 px-8 py-3 rounded-xl text-white">
                    {submitted.caseRef}
                  </div>
                </div>
                <div className="flex gap-3 w-full max-w-xs mt-2">
                  <button
                    onClick={reset}
                    className="flex-1 bg-white/10 hover:bg-white/20 border border-white/10 text-white py-2.5 rounded-xl text-sm font-medium transition-all"
                  >
                    New Report
                  </button>
                  <button
                    onClick={handleClose}
                    className="flex-1 bg-white text-black py-2.5 rounded-xl text-sm font-bold hover:bg-gray-100 transition-all"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* ── STEP 1 — Incident Type ── */}
                {step === 1 && (
                  <div className="space-y-5">
                    <p className="text-xs text-gray-400 uppercase tracking-wider">What type of incident are you reporting?</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {INCIDENT_TYPES.map(it => (
                        <button
                          key={it.label}
                          onClick={() => setIncidentType(it.label)}
                          className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border-2 transition-all text-center ${
                            incidentType === it.label
                              ? `${it.bg} ${it.color} scale-[1.02]`
                              : 'border-white/8 text-gray-500 hover:border-white/20 hover:bg-white/5 hover:text-gray-300'
                          }`}
                        >
                          <it.icon size={20} />
                          <span className="text-[11px] font-medium leading-tight">{it.label}</span>
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        if (!incidentType) { toast.error('Please select an incident type'); return; }
                        setStep(2);
                      }}
                      className="w-full bg-white text-black font-bold py-3.5 rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 mt-2"
                    >
                      Continue <ChevronRight size={16} />
                    </button>
                  </div>
                )}

                {/* ── STEP 2 — Details ── */}
                {step === 2 && (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Description *</label>
                      <div className="relative">
                        <textarea
                          rows={4}
                          value={description}
                          onChange={e => setDescription(e.target.value)}
                          placeholder="Describe what is happening — number of people affected, visible hazards, timeline of events..."
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-sm text-white focus:outline-none focus:border-white/30 resize-none placeholder-gray-600 transition-colors"
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
                        {(['Low', 'Medium', 'High', 'Critical'] as ReportSeverity[]).map(level => (
                          <button
                            key={level}
                            onClick={() => setSeverity(level)}
                            className={`py-2.5 rounded-xl text-xs font-bold tracking-wider border-2 transition-all ${
                              severity === level
                                ? level === 'Critical' ? 'bg-red-600 border-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.35)]'
                                : level === 'High'     ? 'bg-orange-500/30 border-orange-500 text-orange-300'
                                : level === 'Medium'   ? 'bg-amber-500/30 border-amber-500 text-amber-300'
                                :                        'bg-blue-500/30 border-blue-500 text-blue-300'
                                : 'border-white/10 text-gray-500 hover:border-white/30 hover:text-gray-300'
                            }`}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button onClick={() => setStep(1)} className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
                        <ChevronLeft size={15} /> Back
                      </button>
                      <button
                        onClick={() => {
                          if (!description.trim()) { toast.error('Please add a description'); return; }
                          setStep(3);
                        }}
                        className="flex-[2] bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                      >
                        Continue <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}

                {/* ── STEP 3 — Location & Media ── */}
                {step === 3 && (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Location Description</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={location}
                          onChange={e => setLocation(e.target.value)}
                          placeholder="e.g. MG Road near Metro Station, Building 3 Floor 2"
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/30 placeholder-gray-600"
                        />
                        <button
                          type="button"
                          onClick={detectLocation}
                          disabled={detectingLocation}
                          className="shrink-0 bg-white/5 border border-white/10 rounded-xl px-3 flex items-center gap-1.5 text-gray-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
                          title="Auto-detect location"
                        >
                          <Crosshair size={14} className={detectingLocation ? 'animate-spin' : ''} />
                          <span className="text-[10px] font-mono">{detectingLocation ? 'Detecting...' : 'Detect'}</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 flex justify-between items-center">
                        <span>Pin on Map <span className="normal-case text-gray-600">(optional)</span></span>
                        {coords && <span className="text-green-400 text-[10px]">📍 {coords[0].toFixed(3)}, {coords[1].toFixed(3)}</span>}
                      </label>
                      <div className="h-[200px] rounded-xl overflow-hidden border border-white/10 relative z-0">
                        <MapContainer center={[12.9716, 77.5946]} zoom={11} style={{ height: '100%', width: '100%' }}>
                          <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                          <LocationPicker coords={coords} setCoords={setCoords} />
                        </MapContainer>
                        {!coords && (
                          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-[400] bg-black/20">
                            <span className="bg-black/80 text-white px-4 py-2 rounded-full text-xs border border-white/10 flex items-center gap-2">
                              <MapPin size={11} /> Click map to drop pin
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Attach Evidence <span className="normal-case text-gray-600">(optional, max 5)</span></label>
                      <input ref={fileRef} type="file" accept="image/*,video/*" multiple onChange={handleMediaUpload} className="hidden" />
                      <button
                        onClick={() => fileRef.current?.click()}
                        className="w-full border-2 border-dashed border-white/15 rounded-xl py-4 flex flex-col items-center gap-1.5 text-gray-500 hover:border-white/30 hover:bg-white/5 hover:text-gray-300 transition-all"
                      >
                        <Upload size={20} />
                        <span className="text-xs">Click to attach photos or videos</span>
                        <span className="text-[10px] text-gray-600">JPG · PNG · MP4</span>
                      </button>
                      {mediaNames.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {mediaNames.map((n, i) => (
                            <div key={i} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-300">
                              <Camera size={11} className="text-blue-400" /> {n}
                              <button onClick={() => setMediaNames(p => p.filter((_, j) => j !== i))} className="text-gray-600 hover:text-red-400 transition-colors">
                                <X size={10} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <button onClick={() => setStep(2)} className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
                        <ChevronLeft size={15} /> Back
                      </button>
                      <button
                        onClick={() => setStep(4)}
                        className="flex-[2] bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                      >
                        Continue <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}

                {/* ── STEP 4 — Review & Submit ── */}
                {step === 4 && (
                  <div className="space-y-4">
                    {/* Summary Card */}
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
                      <h3 className="text-xs text-gray-400 uppercase tracking-wider mb-4">Review Your Report</h3>
                      {[
                        ['Type',        incidentType],
                        ['Severity',    severity],
                        ['Description', description.length > 80 ? description.slice(0, 80) + '…' : description],
                        ['Location',    location || (coords ? `${coords[0].toFixed(3)}, ${coords[1].toFixed(3)}` : 'Not specified')],
                        ['Media',       mediaNames.length > 0 ? `${mediaNames.length} file(s)` : 'None'],
                      ].map(([label, value]) => (
                        <div key={label} className="flex gap-4 text-sm border-b border-white/5 pb-2.5">
                          <span className="text-gray-500 w-24 shrink-0 text-xs uppercase tracking-wide">{label}</span>
                          <span className={`text-white text-xs ${
                            label === 'Severity'
                              ? value === 'Critical' ? 'text-red-400 font-bold'
                              : value === 'High'     ? 'text-orange-400 font-bold'
                              : value === 'Medium'   ? 'text-amber-400'
                              :                        'text-blue-400'
                              : ''
                          }`}>{value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Identity */}
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                      <h3 className="text-xs text-gray-400 uppercase tracking-wider mb-3">Your Identity</h3>
                      <div className="flex gap-2 mb-3">
                        <button
                          onClick={() => setAnonymous(true)}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border-2 transition-all ${
                            anonymous ? 'bg-white/10 border-white text-white' : 'border-white/10 text-gray-500 hover:border-white/30'
                          }`}
                        >
                          🔒 Stay Anonymous
                        </button>
                        <button
                          onClick={() => setAnonymous(false)}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border-2 transition-all ${
                            !anonymous ? 'bg-white/10 border-white text-white' : 'border-white/10 text-gray-500 hover:border-white/30'
                          }`}
                        >
                          👤 Provide Name
                        </button>
                      </div>
                      {!anonymous ? (
                        <input
                          type="text"
                          value={reporterName}
                          onChange={e => setReporterName(e.target.value)}
                          placeholder="Your full name (optional)"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/30 placeholder-gray-600"
                        />
                      ) : (
                        <p className="text-[11px] text-gray-600">Your identity will be fully stripped before submission.</p>
                      )}
                    </div>

                    <div className="flex gap-3 pb-2">
                      <button onClick={() => setStep(3)} className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
                        <ChevronLeft size={15} /> Back
                      </button>
                      <button
                        onClick={handleSubmit}
                        className="flex-[2] bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(239,68,68,0.35)] hover:shadow-[0_0_32px_rgba(239,68,68,0.5)]"
                      >
                        <ShieldAlert size={16} /> Submit Report
                      </button>
                    </div>
                    <p className="text-[10px] text-center text-gray-600 pb-1">
                      Reports are forwarded instantly to the response team and on-duty officers.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
