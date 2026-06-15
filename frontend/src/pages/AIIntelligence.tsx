import React, { useState, useEffect, useMemo } from 'react';
import { AnimatedHeading } from '../components/AnimatedHeading';
import { FadeIn } from '../components/FadeIn';
import { 
  RefreshCw, MapPin, AlertTriangle, Activity, Users, Clock, 
  ShieldAlert, Cpu, Navigation, Target, CheckCircle2, 
  XCircle, TrendingUp, Calendar, Clock4, Route as RouteIcon
} from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, LineChart, Line, YAxis, CartesianGrid } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Polyline, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet markers in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Data Mocking Helpers
const ZONES = ['Indiranagar', 'Koramangala', 'Whitefield', 'Jayanagar', 'Malleswaram', 'Banashankari', 'Hebbal', 'Yelahanka', 'HSR Layout', 'BTM Layout', 'Bellandur', 'Marathahalli', 'Basavanagudi', 'Rajajinagar', 'Frazer Town', 'Shivajinagar'];

const generateGrid = () => ZONES.map(z => ({ name: z, score: Math.floor(Math.random() * 100) }));

const CRIME_ZONES = [
  { name: 'Shivajinagar', rank: 1, type: 'Theft / Pickpocketing', score: 88, peak: '18:00 - 22:00', count: 142 },
  { name: 'Koramangala', rank: 2, type: 'Vehicle Theft', score: 76, peak: '00:00 - 04:00', count: 98 },
  { name: 'Indiranagar', rank: 3, type: 'Assault', score: 65, peak: '22:00 - 02:00', count: 75 },
  { name: 'Majestic', rank: 4, type: 'Fraud / Scam', score: 58, peak: '10:00 - 16:00', count: 64 },
  { name: 'Whitefield', rank: 5, type: 'Cyber Crime', score: 45, peak: '09:00 - 18:00', count: 41 },
  { name: 'MGR Road', rank: 6, type: 'Vandalism', score: 32, peak: '23:00 - 03:00', count: 28 },
];

const ANOMALY_TYPES = ['Unusual Crowd Gathering', 'Gunshot Audio Pattern', 'Suspicious Vehicle Loitering', 'Fire/Smoke Detected', 'SOS Signal Intercepted', 'Unidentified Drone Detected'];

const ALLOCATION_REC = [
  { id: 1, text: "Deploy 2 additional fire units to Indiranagar", conf: 89, type: "Fire" },
  { id: 2, text: "Reroute patrol Alpha-4 to KR Market due to crowd density", conf: 94, type: "Crowd" },
  { id: 3, text: "Stage 3 ambulances at Majestic transit hub", conf: 78, type: "Medical" },
  { id: 4, text: "Increase perimeter security at Chinnaswamy Stadium", conf: 85, type: "Security" },
  { id: 5, text: "Dispatch drone surveillance to Bellandur lake", conf: 91, type: "Recon" },
];

const PREDICTIVE_DATA_DAILY = [
  { time: 'Mon', fire: 12, theft: 45, assault: 18 },
  { time: 'Tue', fire: 8, theft: 40, assault: 15 },
  { time: 'Wed', fire: 15, theft: 50, assault: 22 },
  { time: 'Thu', fire: 10, theft: 38, assault: 14 },
  { time: 'Fri', fire: 22, theft: 65, assault: 30 },
  { time: 'Sat', fire: 35, theft: 80, assault: 45 },
  { time: 'Sun', fire: 28, theft: 70, assault: 35 },
];

const PREDICTIVE_DATA_HOURLY = Array.from({ length: 24 }).map((_, i) => ({
  time: `${i}:00`,
  fire: Math.floor(Math.random() * 10),
  theft: Math.floor(Math.random() * 20) + 10,
  assault: Math.floor(Math.random() * 5),
}));


export const AIIntelligence: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
  // 1. Grid
  const [gridData, setGridData] = useState(generateGrid());
  const [isRecalculating, setIsRecalculating] = useState(false);

  const handleRecalculate = () => {
    setIsRecalculating(true);
    setTimeout(() => {
      setGridData(generateGrid());
      setIsRecalculating(false);
    }, 1500);
  };

  const top3Grid = useMemo(() => {
    return [...gridData].sort((a, b) => b.score - a.score).slice(0, 3);
  }, [gridData]);

  // 2. Hourly Risk Chart
  const currentHour = new Date().getHours();
  const hourlyData = useMemo(() => {
    return Array.from({ length: 24 }).map((_, i) => ({
      hour: `${i}:00`,
      risk: Math.floor(Math.random() * 80) + (i === currentHour ? 20 : 0)
    }));
  }, [currentHour]);

  // 3. Anomaly Log
  const [anomalies, setAnomalies] = useState([
    { id: 1, time: new Date().toLocaleTimeString(), type: 'Unusual Crowd Gathering', location: 'MG Road Metro', confidence: 92, action: 'Dispatch patrol unit' }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      const newAnomaly = {
        id: Date.now(),
        time: new Date().toLocaleTimeString(),
        type: ANOMALY_TYPES[Math.floor(Math.random() * ANOMALY_TYPES.length)],
        location: ZONES[Math.floor(Math.random() * ZONES.length)],
        confidence: Math.floor(Math.random() * 60) + 40,
        action: 'Awaiting operator review'
      };
      setAnomalies(prev => [newAnomaly, ...prev].slice(0, 8)); // keep last 8
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // 4. Crowd Density
  const [crowdData, setCrowdData] = useState([
    { loc: 'Majestic Bus Stand', density: 80 },
    { loc: 'KR Market', density: 65 },
    { loc: 'Commercial Street', density: 40 },
    { loc: 'Brigade Road', density: 90 },
    { loc: 'Yeshwanthpur Railway Station', density: 55 },
    { loc: 'UB City', density: 30 }
  ]);
  const [crowdRecommendation, setCrowdRecommendation] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      let triggerIndex = -1;
      setCrowdData(prev => {
        const next = prev.map((item, idx) => {
          const change = Math.floor(Math.random() * 21) - 10;
          const newDensity = Math.max(0, Math.min(100, item.density + change));
          if (newDensity > 85) triggerIndex = idx;
          return { ...item, density: newDensity };
        });
        
        if (triggerIndex !== -1) {
          setCrowdRecommendation(`Deploy crowd control barriers and additional traffic police to ${next[triggerIndex].loc}`);
        } else {
          setCrowdRecommendation(null);
        }
        return next;
      });
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // 5. Resource Allocation AI
  const [recommendations, setRecommendations] = useState(ALLOCATION_REC);
  const [deployedActions, setDeployedActions] = useState<{id: number, text: string, time: string}[]>([]);

  const handleAcceptRec = (id: number) => {
    const rec = recommendations.find(r => r.id === id);
    if (rec) {
      setDeployedActions(prev => [{ id: Date.now(), text: rec.text, time: new Date().toLocaleTimeString() }, ...prev]);
      setRecommendations(prev => prev.filter(r => r.id !== id));
    }
  };
  const handleDismissRec = (id: number) => {
    setRecommendations(prev => prev.filter(r => r.id !== id));
  };

  // 6. Predictive Trends Chart
  const [chartView, setChartView] = useState<'daily'|'hourly'>('daily');
  const predictiveChartData = chartView === 'daily' ? PREDICTIVE_DATA_DAILY : PREDICTIVE_DATA_HOURLY;

  // 7. Smart Route Optimizer
  const [vehicleType, setVehicleType] = useState('Ambulance');
  const [origin, setOrigin] = useState('Koramangala 4th Block');
  const [dest, setDest] = useState('Manipal Hospital');
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [showRoute, setShowRoute] = useState(false);

  const handleCalculateRoute = () => {
    setIsCalculatingRoute(true);
    setShowRoute(false);
    setTimeout(() => {
      setIsCalculatingRoute(false);
      setShowRoute(true);
    }, 1500);
  };


  return (
    <div className={`flex flex-col w-full text-white ${embedded ? '' : 'min-h-screen'}`}>
      {/* PAGE HEADER — hidden when embedded in Admin Panel */}
      {!embedded && (
        <div className="mb-10">
          <AnimatedHeading text={"AI\nIntelligence."} className="text-3xl md:text-4xl lg:text-5xl font-normal mb-2 tracking-[-0.04em] leading-tight" />
          <FadeIn delay={200}>
            <p className="text-sm md:text-base text-gray-400">Predictive threat analysis, anomaly detection, and smart resource optimization.</p>
          </FadeIn>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-8">
          
          {/* THREAT PREDICTION GRID */}
          <FadeIn delay={300}>
            <div className="liquid-glass border border-white/10 rounded-2xl p-6 relative">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-medium flex items-center gap-2"><Activity className="text-blue-400" size={20}/> Threat Prediction Grid</h2>
                <button 
                  onClick={handleRecalculate}
                  disabled={isRecalculating}
                  className="liquid-glass border border-white/10 hover:bg-white/10 transition-colors rounded-lg px-4 py-2 text-sm flex items-center gap-2"
                >
                  <RefreshCw size={16} className={isRecalculating ? "animate-spin" : ""} />
                  {isRecalculating ? "Analyzing..." : "Recalculate"}
                </button>
              </div>

              <div className="grid grid-cols-4 gap-3 mb-6">
                {gridData.map((zone, i) => {
                  let borderColor = 'border-green-500/60';
                  if (zone.score > 75) borderColor = 'border-red-500/60';
                  else if (zone.score >= 40) borderColor = 'border-amber-500/60';
                  
                  return (
                    <div key={i} className={`liquid-glass rounded-lg p-3 border transition-colors duration-500 ${borderColor} flex flex-col justify-center items-center text-center`}>
                      <span className="text-xs text-gray-400 w-full mb-1 leading-tight line-clamp-1 break-all" title={zone.name}>{zone.name}</span>
                      <span className="text-lg font-light text-white">{zone.score}</span>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-3">
                <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-2">Top Risk Zones</h3>
                {top3Grid.map((zone, i) => (
                  <div key={i} className="flex justify-between items-center p-3 rounded-xl border border-red-500/30 bg-red-500/10">
                    <span className="text-sm font-medium">{zone.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red-400 font-mono">CRITICAL RISK</span>
                      <span className="text-base text-white">{zone.score}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>

          {/* HIGH-RISK TIME ALERTS */}
          <FadeIn delay={400}>
            <div className="liquid-glass border border-white/10 rounded-2xl p-6">
               <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-medium flex items-center gap-2"><Clock className="text-purple-400" size={20}/> Risk by Hour</h2>
                <span className="text-xs font-mono bg-purple-500/20 text-purple-400 border border-purple-500/30 px-3 py-1 rounded-full">CURRENT RISK: {hourlyData[currentHour].risk}</span>
               </div>
               
               <div className="h-48 w-full mb-6">
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={hourlyData}>
                     <XAxis dataKey="hour" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                     <RechartsTooltip 
                       cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                       contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} 
                     />
                     <Bar dataKey="risk" radius={[4, 4, 0, 0]}>
                       {hourlyData.map((_, index) => (
                         <Cell key={`cell-${index}`} fill={index === currentHour ? '#ffffff' : 'rgba(255,255,255,0.2)'} />
                       ))}
                     </Bar>
                   </BarChart>
                 </ResponsiveContainer>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                 {[1,2,3].map(i => (
                   <div key={i} className="liquid-glass border border-amber-500/20 bg-amber-500/5 rounded-xl p-3 flex flex-col gap-2">
                     <AlertTriangle size={16} className="text-amber-500" />
                     <span className="text-xs text-amber-400 leading-tight">Elevated risk pattern detected in sector {i}</span>
                     <span className="text-[10px] font-mono text-amber-500/60 mt-auto">{80 + Math.floor(Math.random()*15)}% CONFIDENCE</span>
                   </div>
                 ))}
               </div>
            </div>
          </FadeIn>

          {/* RESOURCE ALLOCATION AI */}
          <FadeIn delay={500}>
            <div className="liquid-glass border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-medium flex items-center gap-2 mb-6"><Target className="text-green-400" size={20}/> Resource Allocation AI</h2>
              
              <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto pr-2" style={{ scrollbarWidth: 'none' }}>
                <AnimatePresence>
                  {recommendations.length === 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-gray-500 italic p-4 text-center border border-white/5 rounded-xl">
                      No active recommendations at this time.
                    </motion.div>
                  )}
                  {recommendations.map((rec) => (
                    <motion.div 
                      key={rec.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                      className="liquid-glass border border-white/10 rounded-xl p-4 flex flex-col gap-3"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <p className="text-sm text-white flex-1">{rec.text}</p>
                        <span className="shrink-0 text-[10px] px-2 py-0.5 bg-white/10 text-gray-300 rounded border border-white/10 font-mono">
                          {rec.conf}% CONF
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <button 
                          onClick={() => handleAcceptRec(rec.id)}
                          className="bg-white hover:bg-gray-200 transition-colors text-black text-xs rounded-lg px-4 py-1.5 font-medium flex items-center gap-1"
                        >
                          <CheckCircle2 size={14}/> Accept
                        </button>
                        <button 
                          onClick={() => handleDismissRec(rec.id)}
                          className="hover:bg-white/10 transition-colors text-gray-400 text-xs rounded-lg px-4 py-1.5 flex items-center gap-1"
                        >
                          <XCircle size={14}/> Dismiss
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Deployed Actions Log */}
              <div className="border-t border-white/10 pt-4">
                <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-3">Deployed Actions</h3>
                <div className="space-y-2">
                  <AnimatePresence>
                    {deployedActions.length === 0 && (
                      <div className="text-xs text-gray-600 italic">No actions deployed recently.</div>
                    )}
                    {deployedActions.slice(0, 3).map((action) => (
                      <motion.div 
                        key={action.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-start gap-2 text-xs text-gray-400"
                      >
                        <CheckCircle2 size={14} className="text-green-500 shrink-0 mt-0.5" />
                        <span className="flex-1">{action.text}</span>
                        <span className="font-mono text-[10px] text-gray-500">{action.time}</span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* PREDICTIVE TRENDS CHART */}
          <FadeIn delay={600}>
            <div className="liquid-glass border border-white/10 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-medium flex items-center gap-2"><TrendingUp className="text-blue-400" size={20}/> Predictive Trends</h2>
                <div className="flex items-center gap-1 p-1 bg-black/40 rounded-lg border border-white/5">
                  <button 
                    onClick={() => setChartView('daily')}
                    className={`text-xs px-3 py-1 rounded-md transition-colors flex items-center gap-1 ${chartView === 'daily' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
                  >
                    <Calendar size={12}/> Daily
                  </button>
                  <button 
                    onClick={() => setChartView('hourly')}
                    className={`text-xs px-3 py-1 rounded-md transition-colors flex items-center gap-1 ${chartView === 'hourly' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
                  >
                    <Clock4 size={12}/> Hourly
                  </button>
                </div>
              </div>

              <div className="h-48 w-full mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={predictiveChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="time" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} width={30} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} 
                    />
                    <Line type="monotone" dataKey="theft" stroke="#ffffff" strokeWidth={2} dot={false} name="Theft/Crowd" />
                    <Line type="monotone" dataKey="fire" stroke="rgba(255,255,255,0.6)" strokeWidth={2} dot={false} name="Fire/Hazard" />
                    <Line type="monotone" dataKey="assault" stroke="rgba(255,255,255,0.3)" strokeWidth={2} dot={false} name="Assault/Violence" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="liquid-glass border border-white/10 rounded-xl p-4 text-sm text-gray-300 flex items-start gap-3">
                <Cpu className="text-blue-400 shrink-0 mt-0.5" size={16} />
                <p>Fire incidents expected to rise <span className="text-white font-medium">34%</span> this weekend based on upcoming high-density crowd event data and dry weather forecasts.</p>
              </div>
            </div>
          </FadeIn>

        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-8">
          
          {/* CRIME-PRONE ZONES */}
          <FadeIn delay={700}>
            <div className="liquid-glass border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-medium flex items-center gap-2 mb-6"><ShieldAlert className="text-red-400" size={20}/> Crime-Prone Areas</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {CRIME_ZONES.map((zone, i) => (
                  <div key={i} className="liquid-glass border border-white/10 hover:border-white/20 transition-colors rounded-xl p-4 flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/10 text-xs font-mono">{zone.rank}</span>
                        <span className="text-sm font-medium">{zone.name}</span>
                      </div>
                      <span className="text-[10px] px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/20 rounded-md whitespace-nowrap">{zone.type}</span>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                        <span>Risk Level</span>
                        <span>{zone.score}/100</span>
                      </div>
                      <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                        <div className="h-full bg-red-500 rounded-full" style={{ width: `${zone.score}%` }} />
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-end mt-1">
                      <div className="flex flex-col gap-1 text-xs text-gray-400">
                        <span>Peak: {zone.peak}</span>
                        <span>7-day count: <span className="text-white">{zone.count}</span></span>
                      </div>
                      <button className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors">
                        <MapPin size={12}/> View Map
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>

          {/* SMART ROUTE OPTIMIZER */}
          <FadeIn delay={800}>
            <div className="liquid-glass border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-medium flex items-center gap-2 mb-6"><RouteIcon className="text-purple-400" size={20}/> Smart Route Optimizer</h2>
              
              <div className="flex flex-col gap-4 mb-6">
                <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                  {['Ambulance', 'Patrol', 'Fire Truck'].map(type => (
                    <button 
                      key={type}
                      onClick={() => setVehicleType(type)}
                      className={`flex-1 text-sm py-2 rounded-lg transition-colors ${vehicleType === type ? 'bg-white text-black font-medium' : 'text-gray-400 hover:text-white'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-400 ml-1">Origin</label>
                    <input 
                      type="text" 
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value)}
                      className="bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50"
                      placeholder="e.g. Koramangala 4th Block"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-400 ml-1">Destination</label>
                    <input 
                      type="text" 
                      value={dest}
                      onChange={(e) => setDest(e.target.value)}
                      className="bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50"
                      placeholder="e.g. Manipal Hospital"
                    />
                  </div>
                </div>

                <button 
                  onClick={handleCalculateRoute}
                  disabled={isCalculatingRoute || !origin || !dest}
                  className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-white py-3 rounded-xl font-medium flex justify-center items-center gap-2"
                >
                  {isCalculatingRoute ? <RefreshCw className="animate-spin" size={18} /> : <Navigation size={18} />}
                  {isCalculatingRoute ? 'Calculating Optimal Route...' : 'Calculate Route'}
                </button>
              </div>

              <AnimatePresence>
                {showRoute && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="flex flex-col gap-4 overflow-hidden"
                  >
                    <div className="h-[250px] w-full rounded-xl overflow-hidden relative z-0 border border-white/10">
                      <MapContainer center={[12.946, 77.61]} zoom={13} style={{ height: '100%', width: '100%', background: '#0a0a0a' }} zoomControl={false}>
                        <TileLayer
                          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                          attribution='&copy; <a href="https://carto.com/">Carto</a>'
                        />
                        <Marker position={[12.9352, 77.6245]} /> {/* Koramangala Origin */}
                        <Marker position={[12.956, 77.644]} />   {/* Manipal Hosp Dest */}
                        <Polyline 
                          positions={[[12.9352, 77.6245], [12.94, 77.63], [12.948, 77.635], [12.956, 77.644]]}
                          pathOptions={{ color: '#a855f7', weight: 4, dashArray: '10, 10', className: 'animate-pulse' }} 
                        />
                      </MapContainer>
                      {/* Overlay fade for cyber look */}
                      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_30px_rgba(0,0,0,0.8)] z-[400]" />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-white/5 border border-white/5 rounded-xl p-3 flex flex-col justify-center items-center">
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Distance</span>
                        <span className="text-lg font-medium text-white">4.2 km</span>
                      </div>
                      <div className="bg-white/5 border border-white/5 rounded-xl p-3 flex flex-col justify-center items-center">
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Est. Time</span>
                        <span className="text-lg font-medium text-white">12 min</span>
                      </div>
                      <div className="bg-white/5 border border-white/5 rounded-xl p-3 flex flex-col justify-center items-center">
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Traffic</span>
                        <span className="text-sm px-2 py-0.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded mt-1">Light</span>
                      </div>
                      <div className="bg-white/5 border border-white/5 rounded-xl p-3 flex flex-col justify-center items-center">
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Safety</span>
                        <span className="text-sm px-2 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded mt-1">98/100</span>
                      </div>
                    </div>

                    <div className="mt-2">
                      <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-3">Alternative Routes</h4>
                      <div className="flex flex-col gap-2">
                        <div className="liquid-glass border border-white/5 rounded-xl p-3 flex justify-between items-center hover:bg-white/5 cursor-pointer transition-colors">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium">Via Inner Ring Road</span>
                            <span className="text-xs text-gray-400">Shorter distance, but higher congestion risk.</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">14 min</div>
                            <div className="text-[10px] text-amber-400">Moderate Traffic</div>
                          </div>
                        </div>
                        <div className="liquid-glass border border-white/5 rounded-xl p-3 flex justify-between items-center hover:bg-white/5 cursor-pointer transition-colors">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium">Via 100ft Road</span>
                            <span className="text-xs text-gray-400">Safer corridor, clear intersections, but longer.</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">18 min</div>
                            <div className="text-[10px] text-green-400">Light Traffic</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </FadeIn>

          {/* CROWD DENSITY MONITOR */}
          <FadeIn delay={900}>
            <div className="liquid-glass border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-medium flex items-center gap-2 mb-6"><Users className="text-green-400" size={20}/> Crowd Density Monitor</h2>
              
              {crowdRecommendation && (
                <div className="mb-6 p-4 rounded-xl border border-red-500/40 bg-red-500/10 flex items-start gap-3 animate-pulse">
                  <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={18} />
                  <div>
                    <h4 className="text-sm font-medium text-red-400 mb-1">Critical Crowd Limit Reached</h4>
                    <p className="text-xs text-red-200/80">{crowdRecommendation}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {crowdData.map((item, i) => (
                  <div key={i} className="liquid-glass border border-white/10 rounded-xl p-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-300">{item.loc}</span>
                      <span className="font-mono text-white">{item.density}%</span>
                    </div>
                    <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${item.density > 80 ? 'bg-red-500' : item.density > 50 ? 'bg-amber-500' : 'bg-green-500'}`} 
                        style={{ width: `${item.density}%` }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>

          {/* ANOMALY DETECTION LOG */}
          <FadeIn delay={1000}>
            <div className="liquid-glass border border-white/10 rounded-2xl p-0 overflow-hidden flex flex-col h-[320px]">
              <div className="p-5 border-b border-white/10 flex justify-between items-center bg-black/20">
                <h2 className="text-lg font-medium flex items-center gap-2"><Cpu className="text-teal-400" size={20}/> Anomaly Log</h2>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                  <span className="text-[10px] text-teal-400 font-mono">LISTENING</span>
                </div>
              </div>
              
              <div className="flex-1 overflow-hidden relative bg-black/10">
                <div className="absolute inset-0 p-5 flex flex-col gap-3 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                  <AnimatePresence initial={false}>
                    {anomalies.map((anomaly) => {
                      let badgeColor = 'bg-green-500/20 text-green-400 border-green-500/30';
                      if (anomaly.confidence > 80) badgeColor = 'bg-red-500/20 text-red-400 border-red-500/30';
                      else if (anomaly.confidence >= 50) badgeColor = 'bg-amber-500/20 text-amber-400 border-amber-500/30';

                      return (
                        <motion.div 
                          key={anomaly.id}
                          initial={{ opacity: 0, x: -20, height: 0 }}
                          animate={{ opacity: 1, x: 0, height: 'auto' }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.3 }}
                          className="liquid-glass border border-white/5 rounded-xl p-4 flex flex-col gap-2 shrink-0 bg-white/5"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-gray-500 font-mono">{anomaly.time}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded border font-mono ${badgeColor}`}>
                                {anomaly.confidence}% CONF
                              </span>
                            </div>
                            <span className="text-[10px] text-gray-400 flex items-center gap-1"><MapPin size={10}/> {anomaly.location}</span>
                          </div>
                          <div className="text-sm font-medium text-white">{anomaly.type}</div>
                          <div className="text-xs text-teal-400/80">Recommended: <span className="text-gray-400">{anomaly.action}</span></div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </FadeIn>

        </div>
      </div>
    </div>
  );
};
