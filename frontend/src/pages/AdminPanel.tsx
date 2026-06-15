import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FadeIn } from '../components/FadeIn';
import {
  Shield, PlusSquare, Truck, Navigation, X, MapPin,
  LayoutDashboard, Video, Lock, Key, Brain,
  AlertTriangle, AlertCircle, Info, BarChart2, List,
  Radio, ChevronRight, ShieldCheck, Settings
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { IncidentManagementTable } from '../components/admin/IncidentManagementTable';
import { AnalyticsRow } from '../components/admin/AnalyticsRow';
import { CCTVIntegration } from '../components/admin/CCTVIntegration';
import { AIIntelligence } from './AIIntelligence';
import { AdvancedSettings } from './AdvancedSettings';
import { reportStore } from '../store/reportStore';

// ─── Map helpers ──────────────────────────────────────────────────────────────
const createResponderIcon = () =>
  L.divIcon({
    className: 'custom-responder-icon',
    html: `<div class="relative w-4 h-4">
             <div class="absolute inset-0 bg-blue-500 rounded-full opacity-60 animate-ping"></div>
             <div class="absolute inset-[3px] bg-blue-500 rounded-full border-[1.5px] border-white shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
           </div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

const ZONES = ['North', 'South', 'East', 'West'];

const ZONE_POLYGONS: Record<string, { bounds: [number, number][]; color: string; status: string }> = {
  North: { bounds: [[13.0, 77.55], [13.0, 77.65], [12.98, 77.65], [12.98, 77.55]], color: '#ef4444', status: 'Active Incident' },
  South: { bounds: [[12.93, 77.55], [12.93, 77.65], [12.91, 77.65], [12.91, 77.55]], color: '#22c55e', status: 'Secured' },
  East:  { bounds: [[12.97, 77.65], [12.97, 77.75], [12.95, 77.75], [12.95, 77.65]], color: '#22c55e', status: 'Secured' },
  West:  { bounds: [[12.97, 77.45], [12.97, 77.55], [12.95, 77.55], [12.95, 77.45]], color: '#ef4444', status: 'Active Incident' },
};

const INITIAL_RESPONDERS = [
  { id: 'AMB-01', type: 'Ambulance',  zone: 'North', status: 'En Route',   lat: 12.990, lng: 77.60, target: 'MG Road Accident',  ping: '10s ago' },
  { id: 'FTR-04', type: 'Fire Truck', zone: 'North', status: 'On Scene',   lat: 12.985, lng: 77.61, target: 'Warehouse Fire',    ping: '12s ago' },
  { id: 'PAT-12', type: 'Patrol Car', zone: 'North', status: 'Patrolling', lat: 12.982, lng: 77.58, target: 'Routine',           ping: '5s ago'  },
  { id: 'AMB-02', type: 'Ambulance',  zone: 'South', status: 'Available',  lat: 12.920, lng: 77.60, target: 'None',              ping: '2s ago'  },
  { id: 'PAT-08', type: 'Patrol Car', zone: 'East',  status: 'Patrolling', lat: 12.960, lng: 77.70, target: 'Routine',           ping: '8s ago'  },
  { id: 'FTR-02', type: 'Fire Truck', zone: 'West',  status: 'Available',  lat: 12.960, lng: 77.50, target: 'None',              ping: '1s ago'  },
];

const DISPATCH_TYPES = [
  { type: 'Ambulance',  icon: PlusSquare, initialCount: 12, color: 'text-blue-400'  },
  { type: 'Fire Truck', icon: Truck,      initialCount: 8,  color: 'text-red-400'   },
  { type: 'Patrol Car', icon: Shield,     initialCount: 24, color: 'text-amber-400' },
];

// Live-feed mocks (for overview)
const INCIDENT_TYPES_FEED = ['Assault Report', 'Accident', 'Riot', 'Gas Leak', 'Theft', 'SOS Triggered'];
const FEED_LOCATIONS     = ['Majestic', 'Hebbal', 'Yelahanka', 'Malleshwaram', 'BTM Layout', 'Banashankari', 'Rajajinagar'];
const SEVERITIES_FEED    = ['critical', 'high', 'medium', 'low'];
const INITIAL_FEED = [
  { id: 1, type: 'Medical Emergency',   location: 'Indiranagar', time: '2m ago',  severity: 'critical' },
  { id: 2, type: 'Fire Alert',          location: 'Whitefield',  time: '14m ago', severity: 'high'     },
  { id: 3, type: 'Suspicious Activity', location: 'Jayanagar',   time: '35m ago', severity: 'medium'   },
  { id: 4, type: 'Road Closure',        location: 'Cantonment',  time: '1h ago',  severity: 'low'      },
];

// MapClickDetector helper
const MapClickDetector = ({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) => {
  useMapEvents({ click(e) { onMapClick(e.latlng.lat, e.latlng.lng); } });
  return null;
};

// ─── Sidebar items ─────────────────────────────────────────────────────────────
type Section = 'overview' | 'map' | 'responders' | 'analytics' | 'incidents' | 'cctv' | 'ai' | 'advanced';

const SIDEBAR_ITEMS: { id: Section; label: string; icon: React.ElementType; badge?: string }[] = [
  { id: 'overview',   label: 'Overview',        icon: LayoutDashboard },
  { id: 'map',        label: 'Live Map',         icon: MapPin,         badge: 'LIVE' },
  { id: 'responders', label: 'Responders',       icon: Radio },
  { id: 'analytics',  label: 'Analytics',        icon: BarChart2 },
  { id: 'incidents',  label: 'Incidents',        icon: List },
  { id: 'cctv',       label: 'CCTV',             icon: Video },
  { id: 'ai',         label: 'AI Intelligence',  icon: Brain },
  { id: 'advanced',   label: 'Advanced Tools',   icon: Settings },
];

// ─── Severity helper ───────────────────────────────────────────────────────────
const getSeverityBadge = (severity: string) => {
  const map: Record<string, string> = {
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
    high:     'bg-orange-500/20 text-orange-400 border-orange-500/30',
    medium:   'bg-amber-500/20 text-amber-400 border-amber-500/30',
    low:      'bg-green-500/20 text-green-400 border-green-500/30',
  };
  return map[severity] || map.low;
};

// ═══════════════════════════════════════════════════════════════════════════════
export const AdminPanel: React.FC = () => {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword]               = useState('');
  const [authError, setAuthError]             = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin') {
      setIsAuthenticated(true);
      toast.success('Access Granted', { style: { background: '#1a1a1a', border: '1px solid #22c55e', color: '#fff' } });
    } else {
      setAuthError(true);
      toast.error('Invalid Credentials', { style: { background: '#1a1a1a', border: '1px solid #ef4444', color: '#fff' } });
      setTimeout(() => setAuthError(false), 2000);
    }
  };

  // ── Navigation ──────────────────────────────────────────────────────────────
  const [activeSection, setActiveSection] = useState<Section>('overview');
  const [sidebarOpen, setSidebarOpen]     = useState(false);

  // ── Responders / Map state ──────────────────────────────────────────────────
  const [activeZone, setActiveZone]   = useState(ZONES[0]);
  const [responders, setResponders]   = useState(INITIAL_RESPONDERS);
  const [counts, setCounts]           = useState(DISPATCH_TYPES.map(t => t.initialCount));
  const [showModal, setShowModal]     = useState(false);
  const [dispatchType, setDispatchType] = useState('Ambulance');
  const [dispatchLoc, setDispatchLoc]   = useState<[number, number] | null>(null);
  const [dispatchNotes, setDispatchNotes] = useState('');

  // ── Live-feed state ─────────────────────────────────────────────────────────
  const [feedIncidents, setFeedIncidents] = useState(INITIAL_FEED);

  // ── Public Crisis Reports (live from store) ──────────────────────────────────
  const [userReports, setUserReports] = useState(() => reportStore.getAll());

  useEffect(() => {
    const load = () => setUserReports(reportStore.getAll());
    load();
    return reportStore.subscribe(load);
  }, []);

  // Merge user reports into feed format for live display
  const userFeedItems = userReports
    .filter(r => r.status !== 'Dismissed')
    .map(r => ({
      id: r.id as string | number,
      type: r.type,
      location: r.location,
      time: (() => {
        const diff = Math.floor((Date.now() - new Date(r.reportedAt).getTime()) / 60000);
        return diff < 1 ? 'just now' : diff < 60 ? `${diff}m ago` : `${Math.floor(diff/60)}h ago`;
      })(),
      severity: (r.severity === 'Critical' ? 'critical' : r.severity === 'High' ? 'high' : r.severity === 'Medium' ? 'medium' : 'low') as string,
      isPublic: true,
    }));

  const allFeedItems = [...userFeedItems, ...feedIncidents].slice(0, 15);
  const pendingReportsCount = userReports.filter(r => r.status === 'Pending').length;

  // ── Intervals ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const t1 = setInterval(() =>
      setResponders(prev => prev.map(r => ({
        ...r,
        lat: r.lat + (Math.random() - 0.5) * 0.0015,
        lng: r.lng + (Math.random() - 0.5) * 0.0015,
      }))), 3000);
    const t2 = setInterval(() =>
      setResponders(prev => prev.map(r => ({ ...r, ping: `${Math.floor(Math.random() * 10) + 1}s ago` }))), 10000);
    const t3 = setInterval(() => {
      setFeedIncidents(prev => {
        const newInc = {
          id: Date.now(),
          type: INCIDENT_TYPES_FEED[Math.floor(Math.random() * INCIDENT_TYPES_FEED.length)],
          location: FEED_LOCATIONS[Math.floor(Math.random() * FEED_LOCATIONS.length)],
          time: 'just now',
          severity: SEVERITIES_FEED[Math.floor(Math.random() * SEVERITIES_FEED.length)],
        };
        return [newInc, ...prev].slice(0, 10);
      });
    }, 12000);
    return () => { clearInterval(t1); clearInterval(t2); clearInterval(t3); };
  }, []);

  // ── Dispatch helpers ────────────────────────────────────────────────────────
  const handleDispatchOpen = (type: string) => {
    setDispatchType(type); setDispatchLoc(null); setDispatchNotes(''); setShowModal(true);
  };

  const handleConfirmDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchLoc) {
      toast.error('Please select a target location on the map.', { style: { background: '#1a1a1a', border: '1px solid #ef4444', color: '#fff' } });
      return;
    }
    const typeIdx = DISPATCH_TYPES.findIndex(t => t.type === dispatchType);
    if (counts[typeIdx] <= 0) {
      toast.error(`No ${dispatchType}s available!`, { style: { background: '#1a1a1a', border: '1px solid #ef4444', color: '#fff' } });
      return;
    }
    const newCounts = [...counts]; newCounts[typeIdx] -= 1; setCounts(newCounts);
    const newId = `${dispatchType.substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 100)}`;
    setResponders(prev => [{ id: newId, type: dispatchType, zone: activeZone, status: 'En Route', lat: dispatchLoc[0], lng: dispatchLoc[1], target: dispatchNotes || 'Emergency Response', ping: 'Just now' }, ...prev]);
    setShowModal(false);
    toast.success(`${dispatchType} dispatched!`, { style: { background: '#1a1a1a', border: '1px solid #22c55e', color: '#fff' } });
  };

  const filteredResponders = responders.filter(r => r.zone === activeZone);
  const activePolygon = ZONE_POLYGONS[activeZone];
  const mapCenter = activePolygon.bounds[0];

  // ── Stat cards (derived) ────────────────────────────────────────────────────
  const activeUserReportCount = userReports.filter(r => r.status === 'Pending' || r.status === 'Active').length;
  const statCards = [
    { label: 'Active Incidents',    value: (feedIncidents.filter(i => i.severity === 'critical' || i.severity === 'high').length + activeUserReportCount).toString(), trend: 'LIVE',     status: 'danger'  },
    { label: 'Responders Deployed', value: responders.filter(r => r.status !== 'Available').length.toString(),                              trend: 'LIVE',     status: 'neutral' },
    { label: 'Units Available',     value: counts.reduce((a, b) => a + b, 0).toString(),                                                    trend: 'STANDBY',  status: 'success' },
    { label: 'Public Reports',      value: userReports.length.toString(),                                                                    trend: pendingReportsCount > 0 ? `${pendingReportsCount} PENDING` : 'CLEAR', status: pendingReportsCount > 0 ? 'danger' : 'success' },
  ];

  // ══════════════════════════════════════════════════════════════════════════════
  // LOGIN SCREEN
  // ══════════════════════════════════════════════════════════════════════════════
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col w-full text-white min-h-[80vh] items-center justify-center p-4">
        <Toaster position="top-right" />
        <FadeIn className="w-full max-w-sm">
          <div className="liquid-glass border border-white/10 rounded-2xl p-8 flex flex-col items-center text-center shadow-2xl relative overflow-hidden">
            <div className={`absolute inset-0 transition-colors duration-300 ${authError ? 'bg-red-500/10' : 'bg-blue-500/5'}`} />
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center border border-white/10 mb-6 relative z-10 shadow-lg">
              <Lock size={32} className={authError ? 'text-red-400' : 'text-blue-400'} />
            </div>
            <h1 className="text-2xl font-bold tracking-widest uppercase text-white mb-2 relative z-10">Admin Access</h1>
            <p className="text-sm text-gray-400 mb-8 relative z-10">Restricted to administrators. Authenticate to access Command Center.</p>
            <form onSubmit={handleLogin} className="w-full flex flex-col gap-4 relative z-10">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key size={16} className="text-gray-500" />
                </div>
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Enter Password (admin)"
                  className={`w-full bg-black/50 border rounded-lg pl-10 pr-4 py-3 text-sm text-white focus:outline-none transition-all ${authError ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-blue-500/50'}`}
                  autoFocus
                />
              </div>
              <button type="submit" className={`w-full py-3 rounded-lg text-sm font-bold uppercase tracking-widest transition-all ${authError ? 'bg-red-500 hover:bg-red-400 text-white' : 'bg-white hover:bg-gray-200 text-black shadow-[0_0_15px_rgba(255,255,255,0.2)]'}`}>
                Authenticate
              </button>
            </form>
          </div>
        </FadeIn>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // MAIN ADMIN DASHBOARD
  // ══════════════════════════════════════════════════════════════════════════════
  return (
    <div className="flex w-full text-white h-full">
      <Toaster position="top-right" />

      {/* ── INTERNAL SIDEBAR ─────────────────────────────────────────────────── */}
      <aside
        className={`shrink-0 flex flex-col gap-1 py-6 border-r border-white/10 liquid-glass z-30 transition-all duration-300 ${sidebarOpen ? 'w-52' : 'w-16'}`}
        onMouseEnter={() => setSidebarOpen(true)}
        onMouseLeave={() => setSidebarOpen(false)}
      >
        {/* Admin badge */}
        <div className="px-3 mb-4 overflow-hidden">
          <div className={`flex items-center gap-2 px-2 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 transition-all ${sidebarOpen ? '' : 'justify-center'}`}>
            <ShieldCheck size={14} className="text-red-400 shrink-0" />
            {sidebarOpen && <span className="text-[10px] font-bold text-red-400 tracking-widest uppercase whitespace-nowrap">Admin</span>}
          </div>
        </div>

        {SIDEBAR_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          const showPendingBadge = item.id === 'incidents' && pendingReportsCount > 0;
          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`flex items-center gap-3 mx-2 px-2 py-3 rounded-lg transition-all text-left relative ${isActive ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              <div className="shrink-0 w-5 flex items-center justify-center relative">
                <Icon size={20} strokeWidth={1.5} />
                {showPendingBadge && !sidebarOpen && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
              </div>
              {sidebarOpen && (
                <span className="whitespace-nowrap text-sm font-medium flex-1">{item.label}</span>
              )}
              {sidebarOpen && item.badge && (
                <span className="text-[8px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded-full tracking-wider shrink-0 animate-pulse">
                  {item.badge}
                </span>
              )}
              {sidebarOpen && showPendingBadge && (
                <span className="text-[8px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full tracking-wider shrink-0 animate-pulse">
                  {pendingReportsCount}
                </span>
              )}
              {isActive && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-white rounded-l-full" />
              )}
            </button>
          );
        })}
      </aside>

      {/* ── MAIN CONTENT ──────────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 h-full overflow-y-auto">
        <div className="px-8 py-8 pb-12">

          {/* ── Section header ─────────────────────────────────────────────── */}
          <div className="mb-8 flex items-center gap-3">
            {(() => {
              const item = SIDEBAR_ITEMS.find(s => s.id === activeSection)!;
              const Icon = item.icon;
              return (
                <>
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <Icon size={20} className="text-white" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-light tracking-[-0.03em] text-white">{item.label}</h1>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {activeSection === 'overview'   && 'Real-time situational awareness across all zones.'}
                      {activeSection === 'map'        && 'Live zone map with responder tracking and dispatch controls.'}
                      {activeSection === 'responders' && 'Track and manage all active field units.'}
                      {activeSection === 'analytics'  && 'Weekly performance metrics and resource allocation.'}
                      {activeSection === 'incidents'  && 'Full incident log with filtering, sorting, and case details.'}
                      {activeSection === 'cctv'       && 'AI-powered CCTV feeds with real-time anomaly detection.'}
                      {activeSection === 'ai'         && 'Predictive threat analysis, crowd monitoring, and smart routing.'}
                    </p>
                  </div>
                  {item.badge && (
                    <span className="ml-auto text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 px-2.5 py-1 rounded-full tracking-widest animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </>
              );
            })()}
          </div>

          {/* ════════════════════════════════════════════════════════════════════
              OVERVIEW
          ════════════════════════════════════════════════════════════════════ */}
          {activeSection === 'overview' && (
            <FadeIn>
              {/* Stat Cards */}
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
                {statCards.map((stat, idx) => (
                  <div key={idx} className="liquid-glass border border-white/10 rounded-xl px-5 py-5 flex flex-col hover:bg-white/[0.02] transition-colors">
                    <span className="text-xs uppercase tracking-wider text-gray-500 font-medium mb-2">{stat.label}</span>
                    <span className="text-3xl font-light text-white mb-3">{stat.value}</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full w-max mt-auto ${
                      stat.status === 'success' ? 'bg-green-500/20 text-green-400' :
                      stat.status === 'danger'  ? 'bg-red-500/20 text-red-400' :
                      'bg-white/10 text-gray-300'
                    }`}>{stat.trend}</span>
                  </div>
                ))}
              </div>

              {/* Live Feed + Quick-nav cards */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Live Feed */}
                <div className="lg:col-span-2 liquid-glass border border-white/10 rounded-xl flex flex-col overflow-hidden h-[420px]">
                  <div className="p-5 border-b border-white/10 flex items-center justify-between shrink-0 bg-black/40">
                    <h3 className="text-sm font-semibold tracking-wider">LIVE INCIDENT FEED</h3>
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
                    {allFeedItems.map((inc, idx) => (
                      <div key={`${inc.id}-${idx}`} className={`p-3.5 rounded-lg border transition-all flex gap-3 items-start animate-[slideIn_0.3s_ease-out] ${
                        'isPublic' in inc && inc.isPublic ? 'bg-red-500/5 border-red-500/20' : 'bg-black/40 border-white/5 hover:border-white/10'
                      }`}>
                        <div className={`mt-0.5 shrink-0 ${inc.severity === 'critical' ? 'text-red-400' : 'text-gray-400'}`}>
                          {inc.severity === 'critical' || inc.severity === 'high' ? <AlertTriangle size={16} /> : inc.severity === 'medium' ? <AlertCircle size={16} /> : <Info size={16} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <div className="flex items-center gap-2 min-w-0">
                              <h4 className="text-sm font-medium text-white truncate pr-1">{inc.type}</h4>
                              {'isPublic' in inc && inc.isPublic && (
                                <span className="text-[8px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">PUBLIC</span>
                              )}
                            </div>
                            <span className="text-[10px] text-gray-500 border border-white/10 px-1.5 py-0.5 rounded shrink-0">{inc.time}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-400 flex items-center gap-1"><MapPin size={10} />{inc.location}</span>
                            <span className={`text-[9px] border px-1.5 py-0.5 rounded-full uppercase tracking-wider font-bold ${getSeverityBadge(inc.severity)}`}>{inc.severity}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick-access cards */}
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-gray-500 uppercase tracking-widest font-medium">Quick Access</p>
                  {SIDEBAR_ITEMS.filter(s => s.id !== 'overview').map(item => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveSection(item.id)}
                        className="liquid-glass border border-white/10 rounded-xl px-4 py-3.5 flex items-center gap-3 hover:bg-white/5 transition-all group text-left"
                      >
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-white/10 transition-colors">
                          <Icon size={16} className="text-gray-300" strokeWidth={1.5} />
                        </div>
                        <span className="text-sm text-gray-300 group-hover:text-white transition-colors flex-1">{item.label}</span>
                        <ChevronRight size={14} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mini analytics preview */}
              <div className="liquid-glass border border-white/10 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold tracking-wider text-white">ZONE STATUS SNAPSHOT</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(ZONE_POLYGONS).map(([zone, data]) => (
                    <button
                      key={zone}
                      onClick={() => { setActiveSection('map'); setActiveZone(zone); }}
                      className={`rounded-xl border p-4 text-left transition-all hover:opacity-90 ${data.color === '#ef4444' ? 'border-red-500/40 bg-red-500/10' : 'border-green-500/40 bg-green-500/10'}`}
                    >
                      <div className="text-sm font-medium text-white mb-1">{zone} Zone</div>
                      <div className={`text-xs font-mono ${data.color === '#ef4444' ? 'text-red-400' : 'text-green-400'}`}>{data.status}</div>
                      <div className="mt-2 text-[10px] text-gray-500">{responders.filter(r => r.zone === zone).length} units</div>
                    </button>
                  ))}
                </div>
              </div>
            </FadeIn>
          )}

          {/* ════════════════════════════════════════════════════════════════════
              LIVE MAP & DISPATCH
          ════════════════════════════════════════════════════════════════════ */}
          {activeSection === 'map' && (
            <FadeIn>
              {/* Zone selector */}
              <div className="flex gap-3 overflow-x-auto pb-2 mb-6 scrollbar-none">
                {ZONES.map(z => (
                  <button
                    key={z} onClick={() => setActiveZone(z)}
                    className={`transition-all duration-300 border rounded-lg px-6 py-2.5 text-sm font-semibold whitespace-nowrap ${
                      activeZone === z
                        ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                        : 'bg-white/[0.08] border-white/30 text-white hover:bg-white/20 hover:border-white/60'
                    }`}
                  >{z} Zone</button>
                ))}
              </div>

              {/* Map */}
              <div className="h-[420px] w-full liquid-glass border border-white/10 rounded-xl overflow-hidden relative shadow-2xl mb-8">
                <MapContainer key={activeZone} center={mapCenter as [number, number]} zoom={13} style={{ height: '100%', width: '100%', background: '#0a0a0a' }} zoomControl={false} attributionControl={false}>
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                  <Polygon positions={activePolygon.bounds} pathOptions={{ color: activePolygon.color, fillColor: activePolygon.color, fillOpacity: 0.1, weight: 2 }} />
                  {filteredResponders.map(r => (
                    <Marker key={r.id} position={[r.lat, r.lng]} icon={createResponderIcon()}>
                      <Popup>
                        <div className="text-black text-xs min-w-[140px] p-1">
                          <strong className="text-sm block mb-1">{r.id} — {r.type}</strong>
                          <div className="text-gray-600 mb-1">Target: {r.target}</div>
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 uppercase">{r.status}</span>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
                <div className="absolute top-4 left-4 z-[400] flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-xs font-mono shadow-lg">
                  <span className={`w-2 h-2 rounded-full animate-pulse ${activePolygon.color === '#ef4444' ? 'bg-red-500' : 'bg-green-500'}`} />
                  {activeZone.toUpperCase()} ZONE: {activePolygon.status.toUpperCase()}
                </div>
              </div>

              {/* Dispatch Controls */}
              <h3 className="text-sm font-semibold tracking-wider mb-4 flex items-center gap-2">
                <Navigation size={14} className="text-blue-400" /> DISPATCH CONTROLS
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {DISPATCH_TYPES.map((d, i) => {
                  const Icon = d.icon;
                  return (
                    <div key={d.type} className="liquid-glass border border-white/10 rounded-xl p-5 flex flex-col hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-3 mb-5">
                        <div className={`w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center ${d.color}`}><Icon size={20} /></div>
                        <div>
                          <div className="text-white font-medium text-lg leading-tight">{d.type}</div>
                          <div className="text-xs text-gray-400 mt-0.5">Available: <span className="font-mono text-white ml-1 px-1.5 py-0.5 bg-white/10 rounded">{counts[i]}</span></div>
                        </div>
                      </div>
                      <button onClick={() => handleDispatchOpen(d.type)} className="mt-auto w-full py-2.5 bg-white text-black rounded-lg text-sm font-bold hover:bg-gray-200 transition-colors shadow-lg">
                        Dispatch Unit
                      </button>
                    </div>
                  );
                })}
              </div>
            </FadeIn>
          )}

          {/* ════════════════════════════════════════════════════════════════════
              RESPONDERS
          ════════════════════════════════════════════════════════════════════ */}
          {activeSection === 'responders' && (
            <FadeIn>
              {/* Zone selector */}
              <div className="flex gap-3 overflow-x-auto pb-2 mb-6 scrollbar-none">
                {ZONES.map(z => (
                  <button key={z} onClick={() => setActiveZone(z)}
                    className={`transition-all border rounded-lg px-6 py-2.5 text-sm font-semibold whitespace-nowrap ${
                      activeZone === z
                        ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                        : 'bg-white/[0.08] border-white/30 text-white hover:bg-white/20 hover:border-white/60'
                    }`}
                  >{z} Zone</button>
                ))}
              </div>

              {/* Summary pills */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {['En Route', 'On Scene', 'Available'].map(status => (
                  <div key={status} className="liquid-glass border border-white/10 rounded-xl p-4 text-center">
                    <div className="text-2xl font-light text-white mb-1">{filteredResponders.filter(r => r.status === status).length}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider">{status}</div>
                  </div>
                ))}
              </div>

              {/* Table */}
              <div className="liquid-glass border border-white/10 rounded-xl overflow-hidden shadow-xl">
                <div className="p-5 border-b border-white/10 bg-black/20">
                  <h3 className="text-sm font-semibold tracking-wider">RESPONDER TRACKING — {activeZone.toUpperCase()} ZONE</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5 text-xs text-gray-500 uppercase tracking-wider bg-black/40">
                        {['Unit ID', 'Type', 'Location', 'Assignment', 'Status', 'Last Ping'].map(h => (
                          <th key={h} className="text-left px-5 py-4 font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredResponders.length === 0 ? (
                        <tr><td colSpan={6} className="text-center py-10 text-gray-500">No units active in this zone.</td></tr>
                      ) : filteredResponders.map((r, i) => (
                        <tr key={r.id} className="border-b border-white/5 hover:bg-white/5 transition-colors animate-[slideIn_0.4s_ease-out_forwards] opacity-0" style={{ animationDelay: `${i * 80}ms` }}>
                          <td className="px-5 py-4 font-mono font-medium text-white">{r.id}</td>
                          <td className="px-5 py-4 text-gray-300">{r.type}</td>
                          <td className="px-5 py-4 text-gray-400 font-mono text-xs">{r.lat.toFixed(4)}, {r.lng.toFixed(4)}</td>
                          <td className="px-5 py-4 text-gray-300">{r.target}</td>
                          <td className="px-5 py-4">
                            <span className={`text-[10px] border px-2 py-1 rounded-full uppercase tracking-wider font-bold ${
                              r.status === 'En Route'   ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                              r.status === 'On Scene'   ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                              'bg-green-500/20 text-green-400 border-green-500/30'
                            }`}>{r.status}</span>
                          </td>
                          <td className="px-5 py-4 text-gray-400 text-xs font-mono flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />{r.ping}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </FadeIn>
          )}

          {/* ════════════════════════════════════════════════════════════════════
              ANALYTICS
          ════════════════════════════════════════════════════════════════════ */}
          {activeSection === 'analytics' && (
            <FadeIn>
              <AnalyticsRow />
            </FadeIn>
          )}

          {/* ════════════════════════════════════════════════════════════════════
              INCIDENTS
          ════════════════════════════════════════════════════════════════════ */}
          {activeSection === 'incidents' && (
            <FadeIn>
              <IncidentManagementTable />
            </FadeIn>
          )}

          {/* ════════════════════════════════════════════════════════════════════
              CCTV
          ════════════════════════════════════════════════════════════════════ */}
          {activeSection === 'cctv' && (
            <FadeIn>
              <CCTVIntegration />
            </FadeIn>
          )}

          {/* ════════════════════════════════════════════════════════════════════
              AI INTELLIGENCE
          ════════════════════════════════════════════════════════════════════ */}
          {activeSection === 'ai' && (
            <FadeIn>
              <AIIntelligence embedded />
            </FadeIn>
          )}

          {/* ════════════════════════════════════════════════════════════════════
              ADVANCED CAPABILITIES
          ════════════════════════════════════════════════════════════════════ */}
          {activeSection === 'advanced' && (
            <FadeIn>
              <AdvancedSettings />
            </FadeIn>
          )}

        </div>
      </div>

      {/* ── DISPATCH MODAL ────────────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-[1100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="liquid-glass border border-white/10 rounded-2xl p-6 max-w-lg w-full flex flex-col gap-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-white">Deploy Responder Unit</h4>
              <button onClick={() => setShowModal(false)}><X size={20} className="text-gray-400 hover:text-white transition-colors" /></button>
            </div>
            <form onSubmit={handleConfirmDispatch} className="flex flex-col gap-5">
              <div>
                <label className="text-xs text-gray-400 block mb-2 uppercase tracking-wider">Select Unit Type</label>
                <select value={dispatchType} onChange={e => setDispatchType(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors [&>option]:bg-zinc-900">
                  {DISPATCH_TYPES.map(d => (
                    <option key={d.type} value={d.type}>{d.type} ({counts[DISPATCH_TYPES.findIndex(x => x.type === d.type)]} available)</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 flex items-center justify-between mb-2 uppercase tracking-wider">
                  Target Location (Click Map)
                  {dispatchLoc && <span className="text-green-400 font-mono text-[10px] normal-case bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">{dispatchLoc[0].toFixed(4)}, {dispatchLoc[1].toFixed(4)}</span>}
                </label>
                <div className="h-[200px] w-full rounded-xl overflow-hidden border border-white/10 relative shadow-inner">
                  <MapContainer center={mapCenter as [number, number]} zoom={13} style={{ height: '100%', width: '100%', background: '#0a0a0a' }} zoomControl={false} attributionControl={false}>
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                    <MapClickDetector onMapClick={(lat, lng) => setDispatchLoc([lat, lng])} />
                    {dispatchLoc && <Marker position={dispatchLoc} icon={createResponderIcon()} />}
                  </MapContainer>
                  {!dispatchLoc && (
                    <div className="absolute inset-0 z-[400] flex items-center justify-center pointer-events-none">
                      <div className="bg-black/80 border border-white/10 px-4 py-2 rounded-lg text-xs font-medium text-white backdrop-blur-md flex items-center gap-2 shadow-xl">
                        <MapPin size={14} className="text-blue-400 animate-bounce" /> Click map to set target
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-2 uppercase tracking-wider">Assignment Notes</label>
                <input value={dispatchNotes} onChange={e => setDispatchNotes(e.target.value)}
                  placeholder="e.g. Critical condition, proceed with caution"
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                  required />
              </div>
              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-white font-medium transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-white hover:bg-gray-200 text-black rounded-xl text-sm font-bold transition-colors shadow-lg">Confirm Dispatch</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      ` }} />
    </div>
  );
};
