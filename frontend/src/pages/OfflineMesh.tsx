import React, { useState, useEffect, useRef } from 'react';
import { AnimatedHeading } from '../components/AnimatedHeading';
import { FadeIn } from '../components/FadeIn';
import { 
  Wifi, WifiOff, Radio, Send, Users, 
  Smartphone, ShieldAlert, MapPin, Phone, AlertTriangle, X
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export const OfflineMesh: React.FC = () => {
  // 1. Network Status State
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Connection restored. Switching to main network.');
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.error('Connection lost. Offline Mode active.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 2. SMS Fallback State
  const [smsName, setSmsName] = useState('User');
  const [smsLog, setSmsLog] = useState<{time: string, msg: string}[]>([]);

  const handleSendSMS = () => {
    const time = new Date().toLocaleTimeString();
    const msg = `EMERGENCY — ${smsName} needs help. GPS: 12.9716, 77.5946. Time: ${time}. Reply SAFE to confirm receipt.`;
    setSmsLog(prev => [{ time, msg }, ...prev]);
    toast.success('SMS dispatched via cellular network');
  };

  // 3. Wi-Fi Direct State
  const [wifiMessage, setWifiMessage] = useState('');
  const [wifiLog, setWifiLog] = useState<{time: string, msg: string}[]>([]);

  const handleSendWifi = () => {
    if (!wifiMessage.trim()) return;
    setWifiLog(prev => [{ time: new Date().toLocaleTimeString(), msg: wifiMessage }, ...prev]);
    setWifiMessage('');
    toast.success('Message broadcasted via Wi-Fi Direct');
  };

  // 4. Low Network Mode State
  const [isLowNetworkMode, setIsLowNetworkMode] = useState(false);

  // 5. Mesh Visualizer Canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [meshLog, setMeshLog] = useState<{time: string, text: string}[]>([]);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const rippleRef = useRef({ active: false, radius: 0, maxRadius: 200 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const nodes = [
      { id: 'You', x: 200, y: 150, size: 12, color: '#ffffff' },
      { id: 'Node A', x: 100, y: 80, size: 8, color: '#9ca3af' },
      { id: 'Node B', x: 300, y: 80, size: 8, color: '#9ca3af' },
      { id: 'Node C', x: 320, y: 220, size: 8, color: '#9ca3af' },
      { id: 'Node D', x: 80, y: 220, size: 8, color: '#9ca3af' },
      { id: 'Node E', x: 200, y: 50, size: 8, color: '#9ca3af' },
      { id: 'Node F', x: 200, y: 250, size: 8, color: '#9ca3af' },
    ];

    let animationId: number;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw dashed connections from "You" to others
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      
      const centerNode = nodes[0];
      
      for (let i = 1; i < nodes.length; i++) {
        ctx.beginPath();
        ctx.moveTo(centerNode.x, centerNode.y);
        ctx.lineTo(nodes[i].x, nodes[i].y);
        ctx.stroke();
      }

      // Draw ripple if active
      if (rippleRef.current.active) {
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(centerNode.x, centerNode.y, rippleRef.current.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(239, 68, 68, ${1 - rippleRef.current.radius / rippleRef.current.maxRadius})`;
        ctx.lineWidth = 3;
        ctx.stroke();

        rippleRef.current.radius += 2;
        if (rippleRef.current.radius > rippleRef.current.maxRadius) {
          rippleRef.current.active = false;
        }
      }

      // Draw nodes and labels
      ctx.setLineDash([]);
      nodes.forEach(node => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.fill();
        
        ctx.fillStyle = '#9ca3af';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(node.id, node.x, node.y + 20);
        
        // Signal bars for non-center nodes
        if (node.id !== 'You') {
          ctx.fillStyle = '#3b82f6';
          ctx.fillRect(node.x + 20, node.y - 4, 2, 4);
          ctx.fillRect(node.x + 24, node.y - 6, 2, 6);
          ctx.fillRect(node.x + 28, node.y - 8, 2, 8);
        }
      });

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(animationId);
  }, []);

  const handleBroadcastSOS = () => {
    if (isBroadcasting) return;
    setIsBroadcasting(true);
    rippleRef.current = { active: true, radius: 0, maxRadius: 200 };
    
    // Simulate mesh logs with delays
    const delays = [0, 500, 1000, 1500, 2000, 2500];
    
    delays.forEach((delay, idx) => {
      setTimeout(() => {
        const time = new Date().toLocaleTimeString();
        const nodeChar = String.fromCharCode(65 + idx);
        setMeshLog(prev => [{ time, text: `Hop ${idx+1}: Packet delivered to Node ${nodeChar}` }, ...prev]);
        if (idx === delays.length - 1) setIsBroadcasting(false);
      }, delay);
    });
  };

  // --- LOW NETWORK MODE OVERLAY ---
  if (isLowNetworkMode) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black text-white flex flex-col p-6 overflow-y-auto font-sans">
        <div className="bg-red-600 text-white font-bold text-center py-2 rounded-lg mb-6 tracking-widest uppercase flex items-center justify-center gap-2">
          <AlertTriangle size={20} /> Low Network Mode Active
          <button 
            onClick={() => setIsLowNetworkMode(false)}
            className="absolute right-8 text-white/70 hover:text-white p-2"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center gap-8">
          <button className="w-64 h-64 rounded-full bg-red-600 border-8 border-red-900 shadow-[0_0_50px_rgba(220,38,38,0.5)] flex flex-col items-center justify-center transition-transform hover:scale-105 active:scale-95">
            <ShieldAlert size={80} className="text-white mb-2" />
            <span className="text-3xl font-black tracking-widest">SOS</span>
          </button>

          <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
             <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <MapPin className="text-blue-400" size={24} />
                  <div>
                    <div className="text-xs text-gray-400">Current GPS</div>
                    <div className="font-mono text-lg">12.9716, 77.5946</div>
                  </div>
                </div>
             </div>
             <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <Hospital className="text-green-400" size={24} />
                  <div>
                    <div className="text-xs text-gray-400">Nearest Hospital</div>
                    <div className="font-medium text-lg">Manipal Hosp (1.2km) · 080-2222-1111</div>
                  </div>
                </div>
             </div>
             <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <ShieldAlert className="text-amber-400" size={24} />
                  <div>
                    <div className="text-xs text-gray-400">Nearest Police</div>
                    <div className="font-medium text-lg">Indiranagar (0.8km) · 080-2294-2541</div>
                  </div>
                </div>
             </div>
          </div>

          <div className="w-full max-w-md">
            <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-widest">Emergency Contacts</h3>
            <div className="grid grid-cols-2 gap-3">
              <a href="tel:+919632630072" className="bg-white/10 border border-white/20 p-4 rounded-xl flex flex-col items-center gap-2 hover:bg-white/20 transition-colors text-center">
                <Phone size={24} />
                <span>Brother (+91 96326 30072)</span>
              </a>
              <a href="tel:080-2294-2541" className="bg-white/10 border border-white/20 p-4 rounded-xl flex flex-col items-center gap-2 hover:bg-white/20 transition-colors text-center">
                <Phone size={24} />
                <span>Police (080-2294-2541)</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN LAYOUT ---
  return (
    <div className="flex flex-col w-full text-white min-h-screen pb-10">
      <Toaster position="top-right" toastOptions={{ style: { background: '#1a1a1a', border: '1px solid #333', color: '#fff' } }} />

      <div className="mb-10 flex justify-between items-start">
        <div>
          <AnimatedHeading text={"Offline\nMesh."} className="text-3xl md:text-4xl lg:text-5xl font-normal mb-2 tracking-[-0.04em] leading-tight" />
          <FadeIn delay={200}>
            <p className="text-sm md:text-base text-gray-400">Emergency communications when the internet fails.</p>
          </FadeIn>
        </div>
        
        {/* Low Network Mode Toggle */}
        <FadeIn delay={300}>
          <button 
            onClick={() => setIsLowNetworkMode(true)}
            className="liquid-glass border border-red-500/40 hover:bg-red-500/10 transition-colors rounded-xl px-4 py-2 flex items-center gap-2 text-sm text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
          >
            <AlertTriangle size={16} className="text-red-400" />
            Enable Low Network Mode
          </button>
        </FadeIn>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-8">
          
          {/* NETWORK STATUS CARD */}
          <FadeIn delay={400}>
            <div className={`liquid-glass rounded-xl p-6 border transition-colors duration-500 ${isOnline ? 'border-green-500/30' : 'border-red-500/30'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${isOnline ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                  {isOnline ? <Wifi size={24} /> : <WifiOff size={24} />}
                </div>
                <div>
                  <h2 className="text-lg font-medium mb-1 flex items-center gap-2">
                    Network Status
                    <span className="relative flex h-2.5 w-2.5">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isOnline ? 'bg-green-400' : 'bg-red-400'}`}></span>
                      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    </span>
                  </h2>
                  <p className={`text-sm ${isOnline ? 'text-green-200' : 'text-red-200'}`}>
                    {isOnline ? 'Connected — All systems operational' : 'Offline Mode Active — Emergency protocols engaged'}
                  </p>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* SMS FALLBACK CARD */}
          <FadeIn delay={500}>
            <div className="liquid-glass border border-white/10 rounded-xl p-5">
              <h2 className="text-sm font-semibold tracking-wider mb-4 flex items-center gap-2">
                <Smartphone size={16} className="text-blue-400" /> SMS FALLBACK
              </h2>
              
              <div className="bg-black/40 border border-white/5 rounded-lg p-4 mb-4 font-mono text-xs text-gray-300 leading-relaxed relative">
                EMERGENCY — 
                <input 
                  value={smsName} 
                  onChange={(e) => setSmsName(e.target.value)}
                  className="bg-white/10 border-b border-blue-400 outline-none w-20 text-center mx-1 text-white"
                /> 
                needs help. GPS: 12.9716, 77.5946. Time: [Live]. Reply SAFE to confirm receipt.
              </div>

              <button 
                onClick={handleSendSMS}
                className="w-full bg-blue-600 hover:bg-blue-500 transition-colors text-white py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 mb-4"
              >
                <Send size={16} /> Send SMS Alert
              </button>

              <div className="border-t border-white/10 pt-4">
                <h3 className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">SMS Dispatch Log</h3>
                <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'none' }}>
                  {smsLog.length === 0 && <p className="text-xs text-gray-600 italic">No SMS sent yet.</p>}
                  {smsLog.map((log, i) => (
                    <div key={i} className="bg-white/5 border border-white/5 rounded-md p-2 text-xs flex justify-between items-center">
                      <span className="text-gray-300 truncate pr-4">{log.msg}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="bg-blue-500/20 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded-[4px] text-[10px]">ALL CONTACTS</span>
                        <span className="text-gray-500 font-mono">{log.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </FadeIn>

          {/* WI-FI DIRECT MESSAGING */}
          <FadeIn delay={600}>
            <div className="liquid-glass border border-white/10 rounded-xl p-5">
              <h2 className="text-sm font-semibold tracking-wider mb-4 flex items-center gap-2">
                <Wifi size={16} className="text-purple-400" /> WI-FI DIRECT MESSAGING
              </h2>
              
              <textarea 
                value={wifiMessage}
                onChange={(e) => setWifiMessage(e.target.value)}
                placeholder="Type emergency broadcast message..."
                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-purple-500/50 resize-none h-20 mb-3"
              />
              
              <div className="flex items-center justify-between mb-4">
                <div className="text-xs text-gray-400 flex items-center gap-2">
                  <Users size={14} className="text-gray-500" /> 5 nearby devices found
                </div>
                <button 
                  onClick={handleSendWifi}
                  disabled={!wifiMessage.trim()}
                  className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                >
                  <Send size={14} /> Send
                </button>
              </div>

              <div className="border-t border-white/10 pt-4">
                <h3 className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Message Log</h3>
                <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'none' }}>
                  {wifiLog.length === 0 && <p className="text-xs text-gray-600 italic">No messages broadcasted.</p>}
                  {wifiLog.map((log, i) => (
                    <div key={i} className="bg-white/5 border border-white/5 rounded-md p-3 flex flex-col gap-2">
                      <p className="text-sm text-gray-200">{log.msg}</p>
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-purple-400 flex items-center gap-1"><Wifi size={10} /> Delivered via Wi-Fi Direct</span>
                        <span className="text-gray-500 font-mono">{log.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </FadeIn>

        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-8">
          
          {/* BLUETOOTH MESH VISUALIZER */}
          <FadeIn delay={700}>
            <div className="liquid-glass border border-white/10 rounded-xl p-6 flex flex-col items-center">
              <div className="w-full flex justify-between items-center mb-6">
                 <h2 className="text-sm font-semibold tracking-wider flex items-center gap-2">
                   <Radio size={16} className="text-teal-400" /> BLUETOOTH MESH VISUALIZER
                 </h2>
                 <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" /> Active Array
                 </div>
              </div>
              
              <div className="liquid-glass border border-white/10 rounded-xl overflow-hidden w-full max-w-[400px] mb-6 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
                <canvas 
                  ref={canvasRef} 
                  width={400} 
                  height={300} 
                  className="w-full h-auto block bg-black/20"
                />
              </div>

              <button 
                onClick={handleBroadcastSOS}
                disabled={isBroadcasting}
                className="w-full bg-red-600/20 border border-red-500/40 hover:bg-red-600/30 text-red-200 transition-colors py-3 rounded-lg font-medium flex justify-center items-center gap-2 mb-6"
              >
                <Radio size={18} className={isBroadcasting ? "animate-pulse" : ""} />
                {isBroadcasting ? 'Broadcasting SOS...' : 'Broadcast SOS via Mesh'}
              </button>

              <div className="w-full bg-black/40 border border-white/5 rounded-xl p-4 h-[200px] flex flex-col">
                <h3 className="text-[10px] text-gray-500 uppercase tracking-widest mb-3 shrink-0">Mesh Propagation Log</h3>
                <div className="flex-1 overflow-y-auto space-y-2 pr-1" style={{ scrollbarWidth: 'none' }}>
                  {meshLog.length === 0 && <p className="text-xs text-gray-600 italic">Awaiting broadcast events...</p>}
                  {meshLog.map((log, i) => (
                    <div key={i} className="flex justify-between items-center text-xs animate-[fadeIn_0.3s_ease-out]">
                      <span className="text-gray-300 font-mono">{log.text}</span>
                      <span className="text-gray-600 font-mono text-[10px]">{log.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </FadeIn>

        </div>
      </div>
      
      {/* Component styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-5px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}} />
    </div>
  );
};

function Hospital(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 6v4"/><path d="M14 14h-4"/><path d="M14 18h-4"/><path d="M14 8h-4"/><path d="M18 12h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h2"/><path d="M18 22V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v18"/></svg>;
}
