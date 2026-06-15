import React, { useState, useEffect } from 'react';
import { Camera, ZoomIn, Image as ImageIcon, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';
import { FadeIn } from '../FadeIn';

const CAMERAS = [
  { id: 'CAM-01', location: 'MG Road Junction', initialStatus: 'normal' },
  { id: 'CAM-02', location: 'Indiranagar 100ft', initialStatus: 'alert' },
  { id: 'CAM-03', location: 'Koramangala 4th', initialStatus: 'normal' },
  { id: 'CAM-04', location: 'Whitefield ITBP', initialStatus: 'normal' },
  { id: 'CAM-05', location: 'Jayanagar 4th T', initialStatus: 'normal' },
  { id: 'CAM-06', location: 'Majestic Bus Stand', initialStatus: 'alert' },
];

const DETECTION_TYPES = ['Crowd Anomaly', 'Weapon Detected', 'Unattended Baggage', 'Perimeter Breach', 'Fire/Smoke'];

interface DetectionLog {
  id: number;
  time: string;
  cam: string;
  type: string;
}

export const CCTVIntegration: React.FC = () => {
  const [logs, setLogs] = useState<DetectionLog[]>([
    { id: 1, time: new Date(Date.now() - 120000).toLocaleTimeString(), cam: 'CAM-02', type: 'Crowd Anomaly' },
    { id: 2, time: new Date(Date.now() - 340000).toLocaleTimeString(), cam: 'CAM-06', type: 'Unattended Baggage' },
  ]);

  const [camStates, setCamStates] = useState(
    CAMERAS.reduce((acc, cam) => ({ ...acc, [cam.id]: cam.initialStatus }), {} as Record<string, string>)
  );

  // Randomly generate new alerts
  useEffect(() => {
    const timer = setInterval(() => {
      const randomCam = CAMERAS[Math.floor(Math.random() * CAMERAS.length)].id;
      const randomType = DETECTION_TYPES[Math.floor(Math.random() * DETECTION_TYPES.length)];
      
      setCamStates(prev => ({ ...prev, [randomCam]: 'alert' }));
      setLogs(prev => [{
        id: Date.now(),
        time: new Date().toLocaleTimeString(),
        cam: randomCam,
        type: randomType
      }, ...prev].slice(0, 15));

      // Auto-resolve after 10 seconds
      setTimeout(() => {
        setCamStates(prev => ({ ...prev, [randomCam]: 'normal' }));
      }, 10000);

    }, 8000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* CCTV Grid */}
      <div className="flex-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {CAMERAS.map((cam, i) => {
            const isAlert = camStates[cam.id] === 'alert';
            return (
              <FadeIn key={cam.id} delay={i * 100} className={`liquid-glass border rounded-xl overflow-hidden flex flex-col h-48 transition-colors duration-500 ${isAlert ? 'border-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'border-white/10'}`}>
                
                {/* Video Feed Area */}
                <div className="relative flex-1 bg-[#050505] overflow-hidden flex items-center justify-center">
                  {/* Scanline Animation */}
                  <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)' }} />
                  <div className="absolute top-0 left-0 right-0 h-1 bg-white/20 blur-[2px] animate-[scan_4s_linear_infinite]" />
                  
                  {/* Overlay Badges */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="flex items-center gap-1.5 px-2 py-0.5 bg-black/60 backdrop-blur border border-white/10 rounded text-[10px] font-bold text-white uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> LIVE
                    </span>
                    <span className="px-2 py-0.5 bg-black/60 backdrop-blur border border-white/10 rounded text-[10px] font-mono text-gray-300">
                      {cam.id}
                    </span>
                  </div>

                  {/* AI Status Badge */}
                  <div className="absolute top-3 right-3">
                    {isAlert ? (
                      <span className="flex items-center gap-1.5 px-2 py-1 bg-red-500/20 backdrop-blur border border-red-500/50 rounded text-[10px] font-bold text-red-400 uppercase tracking-wider animate-pulse">
                        <AlertTriangle size={12} /> AI ALERT
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 px-2 py-1 bg-green-500/10 backdrop-blur border border-green-500/20 rounded text-[10px] font-bold text-green-400 uppercase tracking-wider">
                        <ShieldCheck size={12} /> SECURE
                      </span>
                    )}
                  </div>

                  {/* Center Placeholder Icon */}
                  <Camera size={32} className={`opacity-20 ${isAlert ? 'text-red-500' : 'text-white'}`} />
                  
                  {/* Target Box if alert */}
                  {isAlert && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-24 h-24 border-2 border-red-500/60 rounded flex items-start justify-end p-1 relative animate-pulse">
                         <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-red-500" />
                         <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-red-500" />
                         <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-red-500" />
                         <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-red-500" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Controls Bar */}
                <div className={`px-4 py-2 flex items-center justify-between border-t transition-colors duration-500 ${isAlert ? 'bg-red-500/10 border-red-500/20' : 'bg-black/40 border-white/5'}`}>
                  <div className="text-xs font-medium text-white truncate max-w-[120px]">{cam.location}</div>
                  <div className="flex gap-2">
                    <button className="p-1.5 bg-white/10 hover:bg-white/20 rounded transition-colors text-white" title="Snapshot"><ImageIcon size={12} /></button>
                    <button className="p-1.5 bg-white/10 hover:bg-white/20 rounded transition-colors text-white" title="PTZ Zoom"><ZoomIn size={12} /></button>
                  </div>
                </div>
              </FadeIn>
            );
          })}
        </div>
      </div>

      {/* AI Detection Log */}
      <FadeIn delay={600} className="w-full lg:w-80 shrink-0">
        <div className="liquid-glass border border-white/10 rounded-xl flex flex-col h-[600px] overflow-hidden">
          <div className="p-4 border-b border-white/10 bg-black/40 flex items-center gap-2">
            <Activity size={16} className="text-blue-400" />
            <h3 className="text-sm font-semibold tracking-wider text-white">AI DETECTION LOG</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
            {logs.map((log) => (
              <div key={log.id} className="bg-white/5 border border-white/5 rounded-lg p-3 animate-[slideIn_0.3s_ease-out]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-mono font-bold text-red-400">{log.cam}</span>
                  <span className="text-[10px] text-gray-500 font-mono">{log.time}</span>
                </div>
                <div className="text-sm text-gray-300 font-medium">{log.type}</div>
              </div>
            ))}
          </div>
        </div>
      </FadeIn>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan {
          0% { transform: translateY(0); }
          100% { transform: translateY(192px); }
        }
      ` }} />
    </div>
  );
};
