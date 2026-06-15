import React, { useState, useMemo, useEffect } from 'react';
import { Search, Flame, Shield, Activity, Eye, ChevronUp, ChevronDown, X, Clock, Droplets, Users, Zap, AlertTriangle, Radio, MapPin, FileText, Trash2 } from 'lucide-react';
import { reportStore } from '../../store/reportStore';
import type { CrisisReport } from '../../store/reportStore';


const STATUSES = ['Active', 'Resolved', 'Pending', 'Dismissed'];
const SEVERITIES = ['Critical', 'High', 'Medium', 'Low'];

const MOCK_INCIDENTS = Array.from({ length: 12 }, (_, i) => ({
  id: `INC-${1024 + i}`,
  caseRef: `INC-${1024 + i}`,
  type: ['Fire', 'Medical', 'Security'][i % 3],
  description: 'System-generated mock incident for demonstration purposes.',
  location: ['MG Road Junction', 'Indiranagar 100ft Rd', 'Koramangala 4th Block', 'Whitefield ITBP', 'Jayanagar 4th T Block'][i % 5],
  coords: null as [number, number] | null,
  severity: (SEVERITIES[i % 4]) as CrisisReport['severity'],
  reportedAt: new Date(Date.now() - (i * 3600000) - 1200000).toISOString(),
  assignedUnit: ['FTR-04', 'AMB-01', 'PAT-12', 'Unassigned'][i % 4],
  responseTime: i % 4 === 3 ? '—' : `${Math.floor(Math.random() * 12) + 3}m`,
  status: (STATUSES[i % 3]) as CrisisReport['status'],
  anonymous: true,
  media: [] as string[],
  adminNotes: '',
  updatedAt: new Date().toISOString(),
  timeline: [
    { time: 'T-0', action: 'Initial report received via System' },
    { time: 'T+2m', action: `AI classified incident as ${SEVERITIES[i % 4]} severity` },
    { time: 'T+3m', action: 'Automated dispatch protocol initiated' },
    { time: 'T+8m', action: 'First responders arrived on scene' },
  ]
}));

type SortKey = 'id' | 'type' | 'location' | 'severity' | 'reportedAt' | 'assignedUnit' | 'status';

export const IncidentManagementTable: React.FC = () => {
  const [userReports, setUserReports] = useState<CrisisReport[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, _setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortKey, setSortKey] = useState<SortKey>('reportedAt');
  const [sortAsc, setSortAsc] = useState(false);
  const [viewIncident, setViewIncident] = useState<CrisisReport | null>(null);
  const [assignInput, setAssignInput] = useState('');
  const [adminNotesInput, setAdminNotesInput] = useState('');
  const [activeTab, setActiveTab] = useState<'user' | 'system'>('user');

  // Subscribe to live report updates
  useEffect(() => {
    const load = () => setUserReports(reportStore.getAll());
    load();
    return reportStore.subscribe(load);
  }, []);

  // Merge: user reports first, then mock
  const allIncidents: CrisisReport[] = activeTab === 'user' ? userReports : MOCK_INCIDENTS;

  const filtered = useMemo(() => {
    return allIncidents.filter(inc => {
      const matchSearch =
        inc.id.toLowerCase().includes(search.toLowerCase()) ||
        inc.location.toLowerCase().includes(search.toLowerCase()) ||
        inc.type.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === 'All' || inc.type.toLowerCase().includes(typeFilter.toLowerCase());
      const matchStatus = statusFilter === 'All' || inc.status === statusFilter;
      return matchSearch && matchType && matchStatus;
    }).sort((a, b) => {
      const aVal = (a as any)[sortKey] ?? '';
      const bVal = (b as any)[sortKey] ?? '';
      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [allIncidents, search, typeFilter, statusFilter, sortKey, sortAsc]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const updateStatus = (id: string, status: CrisisReport['status']) => {
    reportStore.update(id, {
      status,
      timeline: [
        ...(reportStore.getAll().find(r => r.id === id)?.timeline ?? []),
        { time: new Date().toLocaleTimeString(), action: `Status updated to "${status}" by admin` }
      ]
    });
    if (viewIncident?.id === id) setViewIncident(prev => prev ? { ...prev, status, updatedAt: new Date().toISOString() } : null);
  };

  const assignUnit = (id: string) => {
    if (!assignInput.trim()) return;
    reportStore.update(id, {
      assignedUnit: assignInput,
      timeline: [
        ...(reportStore.getAll().find(r => r.id === id)?.timeline ?? []),
        { time: new Date().toLocaleTimeString(), action: `Unit "${assignInput}" assigned by admin` }
      ]
    });
    setAssignInput('');
    if (viewIncident?.id === id) setViewIncident(prev => prev ? { ...prev, assignedUnit: assignInput } : null);
  };

  const saveNotes = (id: string) => {
    reportStore.update(id, { adminNotes: adminNotesInput });
    if (viewIncident?.id === id) setViewIncident(prev => prev ? { ...prev, adminNotes: adminNotesInput } : null);
  };

  const deleteReport = (id: string) => {
    reportStore.remove(id);
    setViewIncident(null);
  };

  const getSeverityBadge = (sev: string) => {
    const colors: Record<string, string> = {
      'Critical': 'bg-red-500/20 text-red-400 border-red-500/30',
      'High': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      'Medium': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      'Low': 'bg-green-500/20 text-green-400 border-green-500/30'
    };
    return <span className={`text-[10px] border px-2 py-0.5 rounded-full uppercase tracking-wider font-bold ${colors[sev] ?? colors['Low']}`}>{sev}</span>;
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      'Active': 'bg-red-500/20 text-red-400 border-red-500/30',
      'Pending': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      'Resolved': 'bg-green-500/20 text-green-400 border-green-500/30',
      'Dismissed': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    };
    return <span className={`text-[10px] border px-2 py-0.5 rounded-full uppercase tracking-wider font-bold ${colors[status] ?? colors['Pending']}`}>{status}</span>;
  };

  const getTypeIcon = (type: string) => {
    if (type.includes('Fire')) return <Flame size={14} className="text-orange-400" />;
    if (type.includes('Medical') || type.includes('Accident')) return <Activity size={14} className="text-pink-400" />;
    if (type.includes('Flood')) return <Droplets size={14} className="text-blue-400" />;
    if (type.includes('Crowd') || type.includes('Stampede')) return <Users size={14} className="text-amber-400" />;
    if (type.includes('Power')) return <Zap size={14} className="text-yellow-400" />;
    if (type.includes('Violence') || type.includes('Assault')) return <AlertTriangle size={14} className="text-red-400" />;
    return <Shield size={14} className="text-purple-400" />;
  };

  const thClass = "px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors";

  return (
    <div className="flex flex-col gap-4">

      {/* Header with live badge & tab toggle */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('user')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
              activeTab === 'user' ? 'bg-red-500/20 border-red-500/40 text-red-400' : 'border-white/10 text-gray-400 hover:text-white'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Public Reports
            {userReports.length > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {userReports.filter(r => r.status === 'Pending').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
              activeTab === 'system' ? 'bg-white/10 border-white/30 text-white' : 'border-white/10 text-gray-400 hover:text-white'
            }`}
          >
            System Incidents
          </button>
        </div>
        {activeTab === 'user' && userReports.length === 0 && (
          <span className="text-xs text-gray-500 italic">No public reports yet — submit one from Public Tools → Crisis Report</span>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 liquid-glass border border-white/10 rounded-xl p-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search ID, location or type..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-white/30 transition-colors"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-white/30 [&>option]:bg-zinc-900"
        >
          <option value="All">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="liquid-glass border border-white/10 rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-sm">
            <thead className="bg-black/60 sticky top-0 z-10 backdrop-blur-md">
              <tr className="border-b border-white/10">
                <th className={thClass} onClick={() => handleSort('id')}>ID {sortKey==='id' && (sortAsc ? <ChevronUp size={12} className="inline"/> : <ChevronDown size={12} className="inline"/>)}</th>
                <th className={thClass} onClick={() => handleSort('type')}>Type</th>
                <th className={thClass} onClick={() => handleSort('location')}>Location</th>
                <th className={thClass} onClick={() => handleSort('severity')}>Severity</th>
                <th className={thClass} onClick={() => handleSort('reportedAt')}>Reported</th>
                <th className={thClass} onClick={() => handleSort('assignedUnit')}>Unit</th>
                <th className={thClass} onClick={() => handleSort('status')}>Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map(inc => (
                <tr key={inc.id} className={`hover:bg-white/5 transition-colors ${inc.status === 'Pending' && activeTab === 'user' ? 'bg-amber-500/5' : ''}`}>
                  <td className="px-4 py-3 font-mono text-white font-medium text-xs">
                    {inc.id}
                    {activeTab === 'user' && <span className="ml-2 text-[9px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded uppercase">Public</span>}
                  </td>
                  <td className="px-4 py-3"><div className="flex items-center gap-2">{getTypeIcon(inc.type)} <span className="text-gray-300 text-xs">{inc.type}</span></div></td>
                  <td className="px-4 py-3 text-gray-300 text-xs max-w-[140px] truncate">{inc.location}</td>
                  <td className="px-4 py-3">{getSeverityBadge(inc.severity)}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(inc.reportedAt).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true, month: 'short', day: 'numeric' })}</td>
                  <td className="px-4 py-3 font-mono text-gray-300 text-xs">{inc.assignedUnit}</td>
                  <td className="px-4 py-3">{getStatusBadge(inc.status)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => { setViewIncident(inc); setAssignInput(inc.assignedUnit === 'Unassigned' ? '' : inc.assignedUnit); setAdminNotesInput(inc.adminNotes); }}
                      className="p-1.5 bg-white/10 hover:bg-white/20 rounded-md transition-colors text-white"
                    >
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                  {activeTab === 'user' ? 'No public reports yet. Users can submit reports via Public Tools → Crisis Report.' : 'No incidents match your filters.'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail / Admin Modal */}
      {viewIncident && (
        <div className="fixed inset-0 z-[1100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="liquid-glass border border-white/10 rounded-2xl p-6 max-w-2xl w-full flex flex-col max-h-[90vh] overflow-y-auto gap-6">

            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-3 flex-wrap">
                  {viewIncident.caseRef}
                  {getSeverityBadge(viewIncident.severity)}
                  {getStatusBadge(viewIncident.status)}
                  {viewIncident.anonymous && <span className="text-[10px] bg-gray-500/20 border border-gray-500/30 text-gray-400 px-2 py-0.5 rounded-full uppercase">Anonymous</span>}
                </h3>
                <div className="text-sm text-gray-400 flex items-center gap-2 flex-wrap">
                  {getTypeIcon(viewIncident.type)} {viewIncident.type}
                  <span>·</span>
                  <MapPin size={12} /> {viewIncident.location}
                  {viewIncident.reporterName && <><span>·</span> Reporter: {viewIncident.reporterName}</>}
                </div>
              </div>
              <button onClick={() => setViewIncident(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors shrink-0">
                <X size={20} className="text-white" />
              </button>
            </div>

            {/* Description */}
            {viewIncident.description && (
              <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1"><FileText size={10}/> Description</div>
                <p className="text-sm text-gray-300 leading-relaxed">{viewIncident.description}</p>
              </div>
            )}

            {/* Media */}
            {viewIncident.media.length > 0 && (
              <div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Attached Media</div>
                <div className="flex flex-wrap gap-2">
                  {viewIncident.media.map((m, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-300 flex items-center gap-2">
                      📎 {m}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Admin: Status Control */}
            <div className="bg-white/5 border border-white/5 rounded-xl p-4">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1"><Radio size={10} /> Update Status</div>
              <div className="grid grid-cols-4 gap-2">
                {(['Pending','Active','Resolved','Dismissed'] as CrisisReport['status'][]).map(s => (
                  <button
                    key={s}
                    onClick={() => updateStatus(viewIncident.id, s)}
                    className={`py-2 rounded-lg text-xs font-bold border transition-all ${
                      viewIncident.status === s
                        ? s === 'Active' ? 'bg-red-500/30 border-red-500 text-red-300'
                        : s === 'Resolved' ? 'bg-green-500/30 border-green-500 text-green-300'
                        : s === 'Dismissed' ? 'bg-gray-500/30 border-gray-400 text-gray-300'
                        : 'bg-amber-500/30 border-amber-500 text-amber-300'
                        : 'border-white/10 text-gray-500 hover:border-white/30 hover:text-white'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Admin: Assign Unit */}
            <div className="bg-white/5 border border-white/5 rounded-xl p-4">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1"><Shield size={10} /> Assign Responder Unit</div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={assignInput}
                  onChange={e => setAssignInput(e.target.value)}
                  placeholder="e.g. AMB-01, PAT-12, FTR-04"
                  className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30"
                />
                <button
                  onClick={() => assignUnit(viewIncident.id)}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Assign
                </button>
              </div>
              <p className="text-[10px] text-gray-600 mt-1">Current: {viewIncident.assignedUnit}</p>
            </div>

            {/* Admin Notes */}
            <div className="bg-white/5 border border-white/5 rounded-xl p-4">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-3">Admin Notes</div>
              <textarea
                rows={3}
                value={adminNotesInput}
                onChange={e => setAdminNotesInput(e.target.value)}
                placeholder="Internal notes (not visible to reporter)..."
                className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30 resize-none"
              />
              <button onClick={() => saveNotes(viewIncident.id)} className="mt-2 bg-white/10 hover:bg-white/20 text-white text-xs px-4 py-1.5 rounded-lg transition-colors">
                Save Notes
              </button>
            </div>

            {/* Timeline */}
            <div>
              <h4 className="text-sm font-semibold tracking-wider text-white mb-4 border-b border-white/10 pb-2">INCIDENT TIMELINE</h4>
              <div className="relative">
                <div className="absolute left-3 top-2 bottom-2 w-px bg-white/10" />
                <div className="flex flex-col gap-4">
                  {viewIncident.timeline.map((t, i) => (
                    <div key={i} className="flex gap-4 relative">
                      <div className="w-6 h-6 rounded-full bg-black border-2 border-white/20 flex items-center justify-center shrink-0 z-10 mt-0.5">
                        <Clock size={10} className="text-gray-400" />
                      </div>
                      <div className="bg-white/5 border border-white/5 rounded-lg p-3 flex-1">
                        <div className="text-xs font-mono text-blue-400 mb-1">{t.time}</div>
                        <div className="text-sm text-gray-300">{t.action}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="flex gap-3 mt-2">
              {activeTab === 'user' && (
                <button
                  onClick={() => deleteReport(viewIncident.id)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl text-sm font-medium transition-colors"
                >
                  <Trash2 size={14} /> Delete Report
                </button>
              )}
              <button onClick={() => setViewIncident(null)} className="flex-1 py-2.5 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
