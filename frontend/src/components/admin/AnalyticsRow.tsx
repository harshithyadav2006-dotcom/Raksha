import React from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowDownRight, ArrowUpRight, Trophy, Clock } from 'lucide-react';

const INCIDENT_DATA = [
  { name: 'Mon', Fire: 4, Medical: 6, Security: 2 },
  { name: 'Tue', Fire: 2, Medical: 8, Security: 5 },
  { name: 'Wed', Fire: 5, Medical: 5, Security: 3 },
  { name: 'Thu', Fire: 1, Medical: 9, Security: 4 },
  { name: 'Fri', Fire: 3, Medical: 7, Security: 6 },
  { name: 'Sat', Fire: 6, Medical: 4, Security: 8 },
  { name: 'Sun', Fire: 2, Medical: 5, Security: 4 },
];

const RESPONSE_TIME_DATA = Array.from({ length: 14 }, (_, i) => ({
  day: `D-${14 - i}`,
  time: Math.floor(Math.random() * 5) + 6 - (i * 0.1), // slight downward trend
}));

const RESOURCE_DATA = [
  { name: 'Ambulances', value: 35 },
  { name: 'Patrol Cars', value: 45 },
  { name: 'Fire Trucks', value: 20 },
];
const PIE_COLORS = ['#ffffff', '#a1a1aa', '#52525b'];

const LEADERBOARD = [
  { unit: 'PAT-12', type: 'Patrol', avg: '4.2m', trend: 'down' },
  { unit: 'AMB-04', type: 'Medical', avg: '4.8m', trend: 'down' },
  { unit: 'PAT-08', type: 'Patrol', avg: '5.1m', trend: 'up' },
  { unit: 'FTR-02', type: 'Fire', avg: '5.4m', trend: 'down' },
  { unit: 'AMB-01', type: 'Medical', avg: '5.6m', trend: 'up' },
];

export const AnalyticsRow: React.FC = () => {
  return (
    <div className="flex flex-col gap-6">
      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Bar Chart: Incidents by Type */}
        <div className="liquid-glass border border-white/10 rounded-xl p-5 flex flex-col h-[280px]">
          <h3 className="text-xs font-semibold tracking-wider text-gray-400 mb-4 uppercase">Weekly Incidents</h3>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={INCIDENT_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }} 
                />
                <Bar dataKey="Fire" stackId="a" fill="rgba(255,255,255,0.3)" />
                <Bar dataKey="Medical" stackId="a" fill="rgba(255,255,255,0.6)" />
                <Bar dataKey="Security" stackId="a" fill="#ffffff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Line Chart: Response Time */}
        <div className="liquid-glass border border-white/10 rounded-xl p-5 flex flex-col h-[280px]">
          <h3 className="text-xs font-semibold tracking-wider text-gray-400 mb-4 uppercase">Response Time Trend (14D)</h3>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={RESPONSE_TIME_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="day" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} domain={['dataMin - 1', 'dataMax + 1']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }} 
                />
                <Line type="monotone" dataKey="time" stroke="#ffffff" strokeWidth={2} dot={{ r: 3, fill: '#000', stroke: '#fff' }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Resource Deployment */}
        <div className="liquid-glass border border-white/10 rounded-xl p-5 flex flex-col h-[280px]">
          <h3 className="text-xs font-semibold tracking-wider text-gray-400 mb-4 uppercase">Resource Allocation</h3>
          <div className="flex-1 w-full min-h-0 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={RESOURCE_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {RESOURCE_DATA.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }} 
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-white">100</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">Active Units</span>
            </div>
          </div>
        </div>

      </div>

      {/* KPI & Leaderboard Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* KPI Card */}
        <div className="liquid-glass border border-white/10 rounded-xl p-6 flex flex-col justify-center bg-white/5">
          <div className="flex items-center gap-3 mb-2 text-gray-400">
            <Clock size={16} />
            <h3 className="text-sm font-semibold uppercase tracking-wider">Avg Response Time</h3>
          </div>
          <div className="flex items-end gap-4 mb-2">
            <span className="text-5xl font-light text-white tracking-tight">5.2<span className="text-2xl text-gray-500">m</span></span>
            <div className="flex items-center gap-1 text-green-400 bg-green-500/10 px-2 py-1 rounded-lg text-sm font-bold border border-green-500/20 mb-1">
              <ArrowDownRight size={16} /> 12%
            </div>
          </div>
          <p className="text-xs text-gray-500">Compared to 5.9m yesterday. Target: &lt;5.0m</p>
        </div>

        {/* Leaderboard */}
        <div className="liquid-glass border border-white/10 rounded-xl p-5 md:col-span-2">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
            <Trophy size={16} className="text-amber-400" /> Response Time Leaderboard
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {LEADERBOARD.map((item, i) => (
              <div key={i} className="bg-black/40 border border-white/5 rounded-lg p-3 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-mono font-bold text-white">{item.unit}</span>
                  {item.trend === 'down' ? <ArrowDownRight size={12} className="text-green-400" /> : <ArrowUpRight size={12} className="text-red-400" />}
                </div>
                <span className="text-[10px] text-gray-500 mb-1">{item.type}</span>
                <span className="text-lg font-bold text-white mt-auto">{item.avg}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
