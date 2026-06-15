import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import toast, { Toaster } from 'react-hot-toast';
import { AnimatedHeading } from '../components/AnimatedHeading';
import { FadeIn } from '../components/FadeIn';
import { 
  Flame, Droplets, ShieldAlert, 
  ArrowUpRight, ArrowDownRight, Wind, Bell, Navigation 
} from 'lucide-react';
import { reportStore } from '../store/reportStore';
import type { CrisisReport } from '../store/reportStore';

const TABS = ['Fire & Smoke', 'Crowd & Stampede', 'Flood', 'Violence', 'Medical'];

interface TabProps {
  liveReports: CrisisReport[];
}

interface TabWithLogsProps extends TabProps {
  logIncident: (s: string) => void;
}

// ======================
// Reusable Live Reports Feed for Tabs
// ======================
export const LiveTabReportsFeed: React.FC<{
  reports: CrisisReport[];
  title: string;
  themeColor: 'orange' | 'blue' | 'red' | 'pink' | 'purple';
}> = ({ reports, title, themeColor }) => {
  if (reports.length === 0) {
    return (
      <div className="liquid-glass border border-white/10 rounded-xl p-5 text-center flex items-center justify-center min-h-[200px]">
        <p className="text-sm text-gray-400">No active public reports for this category.</p>
      </div>
    );
  }

  const borderColors = {
    orange: 'border-orange-500/30 text-orange-200 bg-orange-500/5',
    blue: 'border-blue-500/30 text-blue-200 bg-blue-500/5',
    red: 'border-red-500/30 text-red-200 bg-red-500/5',
    pink: 'border-pink-500/30 text-pink-200 bg-pink-500/5',
    purple: 'border-purple-500/30 text-purple-200 bg-purple-500/5',
  };

  const badgeColors = {
    Low: 'bg-green-500/20 text-green-300 border-green-500/30',
    Medium: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    High: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    Critical: 'bg-red-500/20 text-red-300 border-red-500/30 animate-pulse',
  };

  return (
    <div className="liquid-glass border border-white/10 rounded-xl p-5 mb-6">
      <h3 className="text-sm font-semibold tracking-wider text-white mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
        {title} ({reports.length})
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        {reports.map((r) => (
          <div
            key={r.id}
            className={`border rounded-xl p-4 flex flex-col justify-between transition-colors ${borderColors[themeColor]}`}
          >
            <div className="flex justify-between items-start mb-2 gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-bold">{r.id}</span>
                <span className={`text-[10px] uppercase font-bold border px-1.5 py-0.5 rounded ${badgeColors[r.severity]}`}>
                  {r.severity}
                </span>
                <span className="text-[10px] bg-white/10 text-white border border-white/20 px-1.5 py-0.5 rounded font-medium">
                  {r.status}
                </span>
              </div>
              <span className="text-[10px] text-gray-400 font-mono">{new Date(r.reportedAt).toLocaleTimeString()}</span>
            </div>
            <p className="text-sm text-white mb-2 leading-relaxed">{r.description}</p>
            <div className="text-[11px] text-gray-400 flex justify-between items-center mt-auto border-t border-white/5 pt-2">
              <span>Loc: <strong className="text-gray-300">{r.location}</strong></span>
              {!r.anonymous && r.reporterName && (
                <span>Reporter: <strong className="text-gray-300">{r.reporterName}</strong></span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ======================
// Helper Mock Generators (Reduced to keep values minimal)
// ======================
const generateFireSensors = () => Array.from({ length: 3 }).map((_, i) => ({
  id: `FS-Z${String(i + 1).padStart(2, '0')}`,
  location: `Area Block ${['A','B','C'][i]}`,
  temp: 20 + Math.floor(Math.random() * 40),
  ppm: 100 + Math.floor(Math.random() * 400),
}));

const generateCrowd = () => Array.from({ length: 2 }).map((_, i) => ({
  id: `CR-${i}`,
  name: `Transit Hub ${['Alpha', 'Bravo'][i]}`,
  count: 300 + Math.floor(Math.random() * 500),
  max: 1000,
  trend: Math.random() > 0.5 ? 'up' : 'down'
}));

const generateFlood = () => Array.from({ length: 3 }).map((_, i) => ({
  id: `FL-${i}`,
  name: `Reservoir Node ${i + 1}`,
  level: Math.floor(Math.random() * 70)
}));

const generateFireGrid = () => Array.from({ length: 9 }).map(() => Math.floor(Math.random() * 100));

// ======================
// Tab Components
// ======================

const FireAndSmokeTab = ({ liveReports: _liveReports }: TabProps) => {
  const [sensors, setSensors] = useState(generateFireSensors());
  const [spreadGrid, setSpreadGrid] = useState(generateFireGrid());
  const [suppression, setSuppression] = useState<boolean[]>(Array(9).fill(false));

  useEffect(() => {
    const int = setInterval(() => {
      setSensors(prev => prev.map(s => ({
        ...s,
        temp: Math.max(15, s.temp + (Math.floor(Math.random() * 11) - 5)),
        ppm: Math.max(50, s.ppm + (Math.floor(Math.random() * 51) - 25))
      })));
      if (Math.random() > 0.5) setSpreadGrid(generateFireGrid());
    }, 5000);
    return () => clearInterval(int);
  }, []);

  const getStatus = (temp: number, ppm: number) => {
    if (temp > 70 || ppm > 450) return { label: 'CRITICAL', color: 'border-red-500 text-red-500', isCritical: true };
    if (temp > 45 || ppm > 300) return { label: 'WARNING', color: 'border-amber-500 text-amber-500', isCritical: false };
    return { label: 'NORMAL', color: 'border-green-500/50 text-green-400', isCritical: false };
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Sensor Array */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sensors.map((s) => {
          const status = getStatus(s.temp, s.ppm);
          return (
            <div key={s.id} className={`liquid-glass border rounded-xl p-4 flex flex-col relative transition-colors ${status.color} ${status.isCritical ? 'animate-[pulseCritical_2s_infinite]' : ''}`} style={{ borderColor: status.isCritical ? '' : 'rgba(255,255,255,0.1)' }}>
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs text-gray-400 font-mono">{s.id}</span>
                <span className={`text-[10px] uppercase font-bold border px-1.5 py-0.5 rounded ${status.color} bg-black/20`}>{status.label}</span>
              </div>
              <h4 className="text-white font-medium mb-3 truncate">{s.location}</h4>
              <div className="flex justify-between mt-auto bg-white/5 rounded-lg p-2">
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-500 uppercase">Temp</span>
                  <span className={`text-lg font-light ${s.temp > 60 ? 'text-red-400' : 'text-white'}`}>{s.temp}°C</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[10px] text-gray-500 uppercase">Smoke PPM</span>
                  <span className={`text-lg font-light ${s.ppm > 400 ? 'text-red-400' : 'text-white'}`}>{s.ppm}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        <div className="liquid-glass border border-white/10 rounded-xl p-5">
          <h3 className="text-sm font-semibold tracking-wider text-white mb-4 flex items-center gap-2"><Flame size={16} className="text-orange-500" /> Fire Spread Prediction</h3>
          <div className="grid grid-cols-3 gap-2 h-[200px]">
            {spreadGrid.map((val, i) => (
              <div key={i} className={`rounded-md flex items-center justify-center text-xs font-mono transition-colors duration-1000 ${val > 75 ? 'bg-red-500/60 text-white' : val > 40 ? 'bg-amber-500/40 text-white/80' : 'bg-green-500/20 text-white/50'}`}>{val}%</div>
            ))}
          </div>
        </div>
        
        <div className="liquid-glass border border-white/10 rounded-xl p-5">
          <h3 className="text-sm font-semibold tracking-wider text-white mb-4 flex items-center gap-2"><Wind size={16} className="text-blue-400" /> Suppression Status</h3>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto h-[200px] pr-2">
            {suppression.map((val, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-3 flex flex-col justify-between cursor-pointer hover:bg-white/10 transition-colors" onClick={() => {
                const arr = [...suppression];
                arr[i] = !arr[i];
                setSuppression(arr);
              }}>
                <span className="text-xs text-gray-400">Sprinkler Z-{i+1}</span>
                <div className="flex justify-between items-center mt-2">
                  <span className={`text-xs font-medium ${val ? 'text-blue-400' : 'text-gray-600'}`}>{val ? 'ACTIVE' : 'IDLE'}</span>
                  <div className={`w-8 h-4 rounded-full relative transition-colors ${val ? 'bg-blue-500/40' : 'bg-white/10'}`}>
                    <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${val ? 'right-0.5' : 'left-0.5 bg-gray-400'}`}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const CrowdTab = ({ liveReports }: TabProps) => {
  const [locations, setLocations] = useState(generateCrowd());
  const [showEvac, setShowEvac] = useState(false);

  useEffect(() => {
    const int = setInterval(() => {
      setLocations(prev => prev.map(loc => {
        let diff = Math.floor(Math.random() * 100) - 40;
        let c = Math.max(0, Math.min(loc.max, loc.count + diff));
        return { ...loc, count: c, trend: c > loc.count ? 'up' : 'down' };
      }));
    }, 8000);
    return () => clearInterval(int);
  }, []);

  const hasCritical = locations.some(l => (l.count / l.max) > 0.9);
  const criticalMapPaths: [number, number][][] = [
    [[12.98, 77.59], [12.97, 77.60], [12.96, 77.58]],
    [[12.95, 77.62], [12.94, 77.63], [12.93, 77.61]]
  ];

  return (
    <div className="flex flex-col gap-6 w-full">
      {hasCritical && (
        <FadeIn>
          <div className="bg-red-500/20 border-l-4 border-red-500 rounded-lg p-4 flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-3">
              <ShieldAlert className="text-red-500" />
              <div>
                <h4 className="text-red-500 font-bold text-sm">CRITICAL CROWD DENSITY DETECTED</h4>
                <p className="text-red-400/80 text-xs mt-0.5">Automated containment algorithms activated in Area Transit Hubs. Disperse units recommended.</p>
              </div>
            </div>
          </div>
        </FadeIn>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-max">
          {locations.map((loc) => {
            const density = loc.count / loc.max;
            const isCritical = density > 0.85;
            return (
              <div key={loc.id} className={`liquid-glass border border-white/10 rounded-xl p-4 ${isCritical ? 'border-red-500/50 bg-red-500/5' : ''}`}>
                <div className="flex justify-between items-start mb-4">
                  <h4 className="text-sm font-medium text-white">{loc.name}</h4>
                  {loc.trend === 'up' ? <ArrowUpRight size={16} className="text-red-400" /> : <ArrowDownRight size={16} className="text-green-400" />}
                </div>
                <div className="flex items-end gap-2 mb-2">
                  <span className={`text-2xl font-light ${isCritical ? 'text-red-400' : 'text-white'}`}>{loc.count}</span>
                  <span className="text-xs text-gray-500 mb-1">/ {loc.max} pax</span>
                </div>
                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-auto">
                  <div className={`h-full rounded-full transition-all duration-1000 ${isCritical ? 'bg-red-500' : density > 0.5 ? 'bg-amber-500' : 'bg-green-500'}`} style={{ width: `${density * 100}%` }}></div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="liquid-glass border border-white/10 rounded-xl overflow-hidden h-[450px] relative flex flex-col">
          <div className="absolute top-4 right-4 z-[400]">
            <button 
              onClick={() => setShowEvac(!showEvac)}
              className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wider transition-all border flex items-center gap-2 ${showEvac ? 'bg-green-500 text-black border-green-400 shadow-[0_0_15px_rgba(34,197,94,0.5)]' : 'bg-black/50 text-white border-white/20 hover:bg-white/10 backdrop-blur'}`}
            >
              <Navigation size={14} /> {showEvac ? 'EVAC ROUTE ACTIVE' : 'ACTIVATE EVAC ROUTE'}
            </button>
          </div>
          <MapContainer center={[12.96, 77.59]} zoom={12} style={{ height: '100%', width: '100%', background: '#0a0a0a' }} zoomControl={false}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
            {criticalMapPaths.map((path, idx) => (
              <React.Fragment key={idx}>
                <Polyline positions={path} color={showEvac ? '#22c55e' : '#ef4444'} weight={showEvac ? 5 : 3} dashArray={showEvac ? '10, 10' : ''} className={showEvac ? 'animate-[dash_1s_linear_infinite]' : ''} />
                <CircleMarker center={path[path.length - 1]} radius={5} fillColor={showEvac ? '#22c55e' : '#ef4444'} color="transparent" fillOpacity={1} />
              </React.Fragment>
            ))}
            {/* Plot live geolocated crowd reports */}
            {liveReports.filter(r => r.coords).map(r => (
              <CircleMarker
                key={r.id}
                center={r.coords!}
                radius={12}
                fillColor="#f59e0b"
                color="#fbbf24"
                fillOpacity={0.7}
                weight={2}
              />
            ))}
          </MapContainer>
          <style dangerouslySetInnerHTML={{__html: `@keyframes dash { to { stroke-dashoffset: -20; } }`}} />
        </div>
      </div>
    </div>
  );
};

const FloodTab = ({ liveReports }: TabProps) => {
  const [gauges, setGauges] = useState(generateFlood());
  const toastFired = useRef(false);

  useEffect(() => {
    const int = setInterval(() => {
      setGauges(prev => {
        const next = prev.map(g => ({ ...g, level: Math.min(100, Math.max(0, g.level + (Math.floor(Math.random() * 20) - 2))) }));
        if (!toastFired.current && next.some(g => g.level > 95)) {
          toast.error('Critical flood alert detected in multiple zones!', { style: { background: '#1a1a1a', border: '1px solid #ef4444', color: '#fff' }});
          toastFired.current = true;
        }
        if (toastFired.current && next.every(g => g.level < 80)) toastFired.current = false;
        return next;
      });
    }, 4000);
    return () => clearInterval(int);
  }, []);

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full h-[500px]">
        <div className="liquid-glass border border-white/10 rounded-xl p-6 h-full flex flex-col">
          <h3 className="text-sm font-semibold tracking-wider text-white mb-6 flex items-center gap-2"><Droplets size={16} className="text-blue-400" /> Internal Reservoir Array</h3>
          <div className="flex-1 flex justify-around items-end pb-4 pt-4 border-b border-white/5 relative">
            <div className="absolute w-full top-[5%] border-t border-dashed border-red-500/50 z-0"><span className="text-[10px] text-red-500/80 absolute -top-4 right-0">95% CRIT</span></div>
            <div className="absolute w-full top-[20%] border-t border-dashed border-amber-500/50 z-0"><span className="text-[10px] text-amber-500/80 absolute -top-4 right-0">80% WARN</span></div>
            {gauges.map((g) => {
              const isCrit = g.level > 95;
              const isWarn = g.level > 80;
              const fill = isCrit ? 'bg-red-500' : isWarn ? 'bg-amber-500' : 'bg-blue-500/80';
              const shadow = isCrit ? 'shadow-[0_0_15px_rgba(239,68,68,0.5)]' : '';
              return (
                <div key={g.id} className="flex flex-col items-center gap-4 z-10 w-full group">
                  <div className="w-8 md:w-12 h-64 bg-black/50 rounded-lg relative overflow-hidden border border-white/10">
                    <div className={`absolute bottom-0 w-full transition-all duration-[2000ms] ease-out rounded-b-lg ${fill} ${shadow}`} style={{ height: `${g.level}%` }}>
                      <div className="absolute top-0 w-full h-2 bg-white/20 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] text-gray-500 mb-1">{g.name}</div>
                    <div className={`font-mono font-bold text-sm ${isCrit ? 'text-red-400' : 'text-white'}`}>{g.level}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="liquid-glass border border-white/10 rounded-xl overflow-hidden relative">
          <div className="absolute top-4 left-4 z-[400] text-xs font-bold tracking-widest text-white/50">LOCAL RADAR OVERLAY</div>
          <MapContainer center={[12.97, 77.59]} zoom={10} style={{ height: '100%', width: '100%', background: '#0a0a0a' }} zoomControl={false} dragging={false}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png" />
            {/* Plot live flood reports */}
            {liveReports.filter(r => r.coords).map(r => (
              <CircleMarker
                key={r.id}
                center={r.coords!}
                radius={12}
                fillColor="#3b82f6"
                color="#60a5fa"
                fillOpacity={0.8}
                weight={2}
              />
            ))}
          </MapContainer>
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-[500]">
            <div className="w-80 h-80 rounded-full border border-blue-500/30 relative flex items-center justify-center">
              <div className="absolute w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,1)]"></div>
              <div className="w-full h-full rounded-full border border-blue-500/10 scale-50"></div>
              <div className="absolute w-1/2 h-full bg-gradient-to-r from-blue-500/0 to-blue-500/20 origin-right rounded-r-full animate-[spin_4s_linear_infinite]" style={{ right: '50%' }}></div>
            </div>
            <div className="absolute w-16 h-12 bg-red-500/30 blur-2xl rounded-full top-[30%] left-[40%] animate-pulse"></div>
            <div className="absolute w-24 h-16 bg-blue-500/40 blur-2xl rounded-full top-[60%] left-[55%] animate-pulse delay-500"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AI_STATUSES = ["Scanning...", "Motion Detected", "Person Detected", "Alert: Suspicious Activity"];

const ViolenceTab = ({ logIncident, liveReports: _liveReports }: TabWithLogsProps) => {
  const [panels, setPanels] = useState(Array.from({ length: 3 }).map((_, i) => ({
    id: i, name: `CCTV-Z${i+1}`, statusIndex: 0
  })));

  useEffect(() => {
    const int = setInterval(() => {
      setPanels(prev => prev.map(p => {
        if (Math.random() > 0.8 && p.statusIndex !== 3) {
          const nextIdx = p.statusIndex + 1;
          if (nextIdx === 3) {
            toast.error(`Suspicious activity on ${p.name}`, { style: { background: '#1a1a1a', border: '1px solid #ef4444', color: '#fff' }});
            logIncident(`Suspicious activity detected on ${p.name}`);
          }
          return { ...p, statusIndex: nextIdx };
        } else if (p.statusIndex === 3 && Math.random() > 0.9) {
           return { ...p, statusIndex: 0 };
        }
        return p;
      }));
    }, 3000);
    return () => clearInterval(int);
  }, []);

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {panels.map(p => {
          const isAlert = p.statusIndex === 3;
          return (
            <div key={p.id} className={`liquid-glass rounded-xl overflow-hidden flex flex-col relative transition-all ${isAlert ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'border-white/10'}`}>
              <div className="h-48 bg-black/80 relative flex items-center justify-center p-4">
                <div className="absolute top-3 left-3 bg-red-600 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider animate-pulse flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-white"></span> LIVE</div>
                <div className="absolute top-3 right-3 text-[10px] text-white/50 font-mono">{new Date().toLocaleTimeString()}</div>
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
                   <svg width="100" height="100" viewBox="0 0 100 100" className="text-green-500"><path d="M50 10 L50 30 M50 70 L50 90 M10 50 L30 50 M70 50 L90 50" stroke="currentColor" strokeWidth="2" /><circle cx="50" cy="50" r="20" stroke="currentColor" strokeWidth="1" fill="none" /></svg>
                </div>
                <div className="absolute bottom-3 left-3 text-xs font-medium bg-black/50 px-2 py-1 rounded backdrop-blur">{p.name}</div>
              </div>
              <div className="p-4 border-t border-white/10 bg-white/5 flex flex-col">
                 <span className={`text-xs font-bold px-2 py-1 rounded inline-block w-max mb-3 transition-colors ${isAlert ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 'bg-white/10 text-gray-300 border border-transparent'}`}>{AI_STATUSES[p.statusIndex]}</span>
                 <div className="flex gap-2">
                   <button className="flex-1 bg-white/10 hover:bg-white/20 text-xs py-1.5 rounded transition-colors text-white">Zoom</button>
                   <button className="flex-1 bg-white/10 hover:bg-white/20 text-xs py-1.5 rounded transition-colors text-white">Snapshot</button>
                 </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
};

const MedicalTab = ({ logIncident, liveReports: _liveReports }: TabWithLogsProps) => {
  const [showETA, setShowETA] = useState(false);
  const [reporterName, setReporterName] = useState('');
  const [location, setLocation] = useState('');
  const [medicalType, setMedicalType] = useState('cardiac');
  const [affectedCount, setAffectedCount] = useState('1');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const typeLabel = {
      cardiac: 'Cardiac Arrest',
      accident: 'Accident / Trauma',
      unconscious: 'Unconscious',
      other: 'Other Medical Emergency'
    }[medicalType] || 'Medical Emergency';

    // Submit a real report
    reportStore.add({
      type: 'Medical Emergency',
      description: `${typeLabel} emergency reported. Affected: ${affectedCount} person(s).`,
      location: location,
      coords: [12.96 + (Math.random() - 0.5) * 0.04, 77.59 + (Math.random() - 0.5) * 0.04],
      severity: 'Critical',
      anonymous: false,
      reporterName: reporterName,
      media: [],
    });

    logIncident(`Medical emergency reported by ${reporterName} at ${location}`);
    toast.success("Emergency Response Initiated & Reported to Central Command", { style: { background: '#1a1a1a', border: '1px solid #22c55e', color: '#fff' }});
    setShowETA(true);

    // Reset form inputs
    setReporterName('');
    setLocation('');
    setAffectedCount('1');
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <form onSubmit={handleSubmit} className="liquid-glass border border-white/10 rounded-xl p-6 flex flex-col gap-4">
          <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse inline-block" />
            Report & Dispatch Emergency
          </h3>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-gray-400 uppercase tracking-wider">Reporter Name</label>
            <input 
              required 
              type="text" 
              placeholder="e.g. Officer Smith" 
              value={reporterName}
              onChange={e => setReporterName(e.target.value)}
              className="bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500/50 transition-colors" 
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-gray-400 uppercase tracking-wider">Location / Ward</label>
            <input 
              required 
              type="text" 
              placeholder="e.g. Block C, Level 3" 
              value={location}
              onChange={e => setLocation(e.target.value)}
              className="bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500/50 transition-colors" 
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-gray-400 uppercase tracking-wider">Medical Situation</label>
            <select 
              value={medicalType}
              onChange={e => setMedicalType(e.target.value)}
              className="bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-red-500/50 transition-colors [&>option]:bg-zinc-900"
            >
               <option value="cardiac">Cardiac Arrest</option>
               <option value="accident">Accident / Trauma</option>
               <option value="unconscious">Unconscious</option>
               <option value="other">Other</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-gray-400 uppercase tracking-wider">People Affected</label>
            <input 
              required 
              type="number" 
              min="1" 
              value={affectedCount}
              onChange={e => setAffectedCount(e.target.value)}
              placeholder="People Affected" 
              className="bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500/50 transition-colors" 
            />
          </div>
          <button type="submit" className="mt-2 bg-white text-black font-semibold rounded-lg px-4 py-3 hover:bg-gray-200 transition-colors">Submit Emergency</button>
        </form>
        
        <div>
          {showETA && (
            <FadeIn>
               <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                 <h4 className="text-sm text-gray-400 mb-4 uppercase tracking-wider">Nearest Active Hospital</h4>
                 <div className="flex items-start justify-between">
                   <div>
                     <div className="text-xl font-medium text-white mb-1">City General Hospital</div>
                     <div className="text-sm text-gray-400">Trauma Level 1 • 2.4 km away</div>
                   </div>
                   <div className="bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg font-bold">
                     ETA: 4 MINS
                   </div>
                 </div>
                 <div className="mt-6 flex gap-2">
                    <div className="flex-1 bg-green-500/20 text-green-400 text-center py-2 rounded-lg text-sm font-medium border border-green-500/30">Ambulance Dispatched</div>
                 </div>
               </div>
            </FadeIn>
          )}
        </div>
      </div>
    </div>
  )
};

const SmartEvacuation = () => {
  const [incidentZone, setIncidentZone] = useState<number | null>(null);

  const getExitPath = (i: number) => {
     if (incidentZone === null || incidentZone === i) return false;
     return Math.abs(incidentZone - i) < 5 && Math.random() > 0.4;
  }

  return (
    <div className="liquid-glass border border-white/10 rounded-xl p-6 mt-8">
      <h3 className="text-lg font-medium text-white mb-6">Smart Evacuation Controller</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div className="relative aspect-square max-w-sm w-full grid grid-cols-5 gap-1 p-3 bg-black/40 border border-white/5 rounded-xl mx-auto lg:mx-0">
           {Array.from({length: 25}).map((_, i) => {
              const isInc = incidentZone === i;
              const isPath = getExitPath(i);
              return (
                <div key={i} onClick={() => setIncidentZone(i)} className={`cursor-pointer border rounded flex items-center justify-center transition-all ${isInc ? 'bg-red-500/40 border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : isPath ? 'bg-green-500/20 border-green-500' : 'bg-white/5 hover:bg-white/10 border-white/10'}`}>
                   {isPath && <div className="text-green-500 animate-[bounce_1s_infinite] text-lg font-bold">↓</div>}
                   {isInc && <ShieldAlert size={16} className="text-red-500" />}
                </div>
              )
           })}
        </div>
        <div className="flex flex-col gap-4">
           {['North Exit Level 1', 'East Corridor Escape', 'Emergency Stairs South'].map((exit, idx) => (
             <div key={idx} className="bg-white/5 border border-white/10 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                   <h4 className="font-medium text-white">{exit}</h4>
                   <span className="bg-green-500/20 text-green-400 text-[10px] uppercase px-2 py-0.5 rounded border border-green-500/30">OPEN</span>
                </div>
                <div className="flex justify-between text-xs text-gray-400 mb-3">
                   <span>Direction: {['North','East','South'][idx]}</span>
                   <span>Dist: {120 + idx * 45}m</span>
                </div>
                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                   <div className={`h-full rounded-full transition-all ${idx === 2 ? 'bg-amber-500 w-[60%]' : 'bg-green-500 w-[20%]'}`}></div>
                </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  )
};

const EmergencyBroadcast = ({ logAlert }: { logAlert: (s:string)=>void }) => {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSend = () => {
    setSending(true);
    setTimeout(() => {
      toast.success("Broadcast sent to all grids", { style: { background: '#1a1a1a', border: '1px solid #22c55e', color: '#fff' }});
      logAlert("Emergency Evacuation Broadcast Triggered manually.");
      setSending(false);
      setOpen(false);
    }, 1500);
  }

  return (
    <div className="mt-8 relative flex justify-center py-8">
      {sending && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <div className="w-24 h-24 rounded-full border-4 border-red-500/50 animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
          <div className="absolute w-48 h-48 rounded-full border-2 border-red-500/30 animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite_0.5s]"></div>
        </div>
      )}
      
      <button onClick={() => setOpen(true)} className="liquid-glass border border-red-500/50 text-white rounded-xl px-12 py-5 text-lg font-bold tracking-widest hover:bg-red-500/10 hover:border-red-500 transition-all flex items-center gap-3 relative z-10 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
         <Bell className="text-red-400" size={24} /> EMERGENCY OVERRIDE BROADCAST
      </button>

      {open && (
        <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-sm flex items-center justify-center">
          <div className="liquid-glass border border-white/10 rounded-xl p-6 max-w-lg w-full m-4">
             <h3 className="text-xl font-medium text-white mb-4">Emergency Broadcast Configuration</h3>
             <div className="flex flex-col gap-4">
                <select className="bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500/50 [&>option]:bg-zinc-900">
                  <option>Evacuation Order</option>
                  <option>Shelter In Place</option>
                  <option>All Clear</option>
                </select>
                <textarea rows={4} className="bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500/50" placeholder="Broadcast message..."></textarea>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-300">
                  <label className="flex items-center gap-2"><input type="checkbox" defaultChecked className="accent-red-500" /> Zone A Transit</label>
                  <label className="flex items-center gap-2"><input type="checkbox" defaultChecked className="accent-red-500" /> Zone B Academic</label>
                  <label className="flex items-center gap-2"><input type="checkbox" defaultChecked className="accent-red-500" /> Zone C Core</label>
                  <label className="flex items-center gap-2"><input type="checkbox" defaultChecked className="accent-red-500" /> Zone D Medical</label>
                </div>
                <div className="flex gap-3 mt-4">
                  <button onClick={() => setOpen(false)} className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm font-medium transition-colors">Cancel</button>
                  <button onClick={handleSend} className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm font-medium transition-colors">Send Alert</button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ======================
// Main Page Shell
// ======================
export const CrisisResponse: React.FC = () => {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [incidents, setIncidents] = useState<string[]>([]);
  const [_publicAlerts, setPublicAlerts] = useState<string[]>([]);
  const [userReports, setUserReports] = useState(() => reportStore.getAll());

  // Subscribe to live user crisis reports
  useEffect(() => {
    const load = () => setUserReports(reportStore.getAll());
    load();
    return reportStore.subscribe(load);
  }, []);

  const getReportsForTab = (tab: string) => {
    switch (tab) {
      case 'Fire & Smoke':
        return userReports.filter(r => r.type === 'Fire & Smoke');
      case 'Crowd & Stampede':
        return userReports.filter(r => r.type === 'Crowd / Stampede');
      case 'Flood':
        return userReports.filter(r => r.type === 'Flood');
      case 'Violence':
        return userReports.filter(r => r.type === 'Violence / Assault' || r.type === 'Security Threat');
      case 'Medical':
        return userReports.filter(r => r.type === 'Medical Emergency');
      default:
        return [];
    }
  };

  const logIncident = (inc: string) => setIncidents(p => [inc, ...p].slice(0, 5));
  const logAlert = (al: string) => setPublicAlerts(p => [al, ...p].slice(0, 5));

  return (
    <div className="flex flex-col w-full text-white min-h-[85vh]">
      <Toaster position="top-right" />
      
      {/* PAGE HEADER */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <AnimatedHeading text={"Crisis\nResponse."} className="text-3xl md:text-4xl lg:text-5xl font-normal mb-2 tracking-[-0.04em] leading-tight" />
          <FadeIn delay={400}>
            <p className="text-sm text-gray-400">Real-time detection across fire, crowd, flood, violence, and medical emergencies.</p>
          </FadeIn>
        </div>
        
        {/* Local Incident Logs at Top */}
        <FadeIn delay={500} className="w-full md:w-auto md:min-w-[320px] max-w-md">
          <div className="liquid-glass rounded-xl border border-white/10 p-4 flex flex-col min-h-[100px] shadow-2xl bg-black/40">
             <h4 className="font-semibold text-white mb-3 text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                Live Incident Logs
             </h4>
             <div className="flex flex-col gap-2 max-h-[100px] overflow-y-auto pr-2 custom-scrollbar">
                {incidents.length === 0 ? (
                  <p className="text-xs text-gray-500 italic">All clear. No active incidents.</p>
                ) : (
                  incidents.map((a, i) => (
                    <div key={i} className="text-xs text-amber-100 bg-amber-500/20 border border-amber-500/30 px-3 py-2 rounded-lg animate-[slideIn_0.3s_ease-out]">
                      {a}
                    </div>
                  ))
                )}
             </div>
          </div>
        </FadeIn>
      </div>

      {/* TABS ROW */}
      <FadeIn delay={600} className="w-full relative sticky top-0 z-50 mb-6 bg-black/80 backdrop-blur-sm py-2">
        <div className="flex flex-wrap gap-3 overflow-x-auto pb-2 scrollbar-none">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`transition-all duration-300 border rounded-lg px-5 py-2.5 text-sm font-medium whitespace-nowrap ${
                activeTab === tab ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.1)]' : 'liquid-glass border-white/10 text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </FadeIn>

      {/* TAB CONTENT RENDERER */}
      <FadeIn delay={800} className="flex-1 w-full">
        {activeTab === 'Fire & Smoke' && <FireAndSmokeTab liveReports={getReportsForTab('Fire & Smoke')} />}
        {activeTab === 'Crowd & Stampede' && <CrowdTab liveReports={getReportsForTab('Crowd & Stampede')} />}
        {activeTab === 'Flood' && <FloodTab liveReports={getReportsForTab('Flood')} />}
        {activeTab === 'Violence' && <ViolenceTab logIncident={logIncident} liveReports={getReportsForTab('Violence')} />}
        {activeTab === 'Medical' && <MedicalTab logIncident={logIncident} liveReports={getReportsForTab('Medical')} />}
      </FadeIn>
      
      <FadeIn delay={1000}>
        <SmartEvacuation />
        <EmergencyBroadcast logAlert={logAlert} />
      </FadeIn>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulseCritical {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); border-color: rgba(239,68,68,1); }
          70% { box-shadow: 0 0 0 15px rgba(239, 68, 68, 0); border-color: rgba(239,68,68,0.2); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); border-color: rgba(239,68,68,1); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
};
