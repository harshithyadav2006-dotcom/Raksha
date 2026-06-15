import React, { useState, useEffect, useRef } from 'react';
import { Camera, Folder, Send } from 'lucide-react';
import toast from 'react-hot-toast';

interface Evidence { id: number; timestamp: string; label: string; }

interface Props { className?: string; }

export const HiddenCamera: React.FC<Props> = ({ className = '' }) => {
  const [enabled, setEnabled] = useState(false);
  const [vault, setVault] = useState<Evidence[]>([]);
  const [showVault, setShowVault] = useState(false);
  const [counter, setCounter] = useState(30);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const counterRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) clearInterval(timerRef.current);
      if (counterRef.current) clearInterval(counterRef.current);
      setCounter(30);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      return;
    }

    setCounter(30);
    counterRef.current = setInterval(() => {
      setCounter(c => c <= 1 ? 30 : c - 1);
    }, 1000);

    timerRef.current = setInterval(() => {
      setVault(prev => [{
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        label: `Frame_${String(prev.length + 1).padStart(3, '0')}.jpg`,
      }, ...prev].slice(0, 20));
      setCounter(30);
    }, 30000);

    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      .then(stream => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(err => {
        console.error(err);
        toast.error('Camera permission denied', { style: { background: '#1a1a1a', border: '1px solid #ef4444', color: '#fff' } });
        setEnabled(false);
      });

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (counterRef.current) clearInterval(counterRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [enabled]);

  return (
    <div className={`liquid-glass border border-white/10 rounded-xl p-5 flex flex-col justify-between ${className}`}>
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold tracking-wider flex items-center gap-2">
              <Camera size={14} className={enabled ? 'text-amber-400' : 'text-gray-400'} /> SILENT CAMERA MODE
            </h3>
            <p className="text-[10px] text-gray-500 mt-0.5">Captures frames silently every 30s. Stored in Evidence Vault.</p>
          </div>
          <button
            onClick={() => setEnabled(e => !e)}
            className={`w-12 h-6 rounded-full relative transition-colors ${enabled ? 'bg-amber-500/30 border border-amber-500/50' : 'bg-white/10 border border-white/10'}`}
          >
            <div className={`absolute top-0.5 w-5 h-5 rounded-full transition-all ${enabled ? 'right-0.5 bg-amber-400' : 'left-0.5 bg-gray-500'}`} />
          </button>
        </div>

        {/* Mock Viewfinder */}
        {enabled && (
          <div className="relative h-28 bg-black border border-amber-500/20 rounded-lg overflow-hidden mb-4 flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-contain opacity-90"
            />
            {/* Scanlines */}
            <div className="absolute inset-0 pointer-events-none z-10" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.02) 3px, rgba(255,255,255,0.02) 4px)' }} />
            {/* Corner brackets */}
            {[['top-2 left-2 border-t border-l',''],['top-2 right-2 border-t border-r',''],['bottom-2 left-2 border-b border-l',''],['bottom-2 right-2 border-b border-r','']].map(([cls], i) => (
              <div key={i} className={`absolute w-4 h-4 border-amber-400/60 z-10 ${cls}`} />
            ))}
            <div className="absolute inset-0 bg-black/20 pointer-events-none flex flex-col justify-end p-2 z-10">
              <div className="flex items-center gap-1 justify-between">
                <span className="text-[10px] text-amber-400 font-mono">CAPTURING · {counter}s</span>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-[9px] text-amber-400 font-mono">REC</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-auto pt-2">
        <button
          onClick={() => setShowVault(v => !v)}
          className="flex items-center gap-2 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-2 transition-colors w-full justify-center"
        >
          <Folder size={13} /> Evidence Vault ({vault.length} frames)
        </button>

        {showVault && (
          <div className="mt-3 flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
            {vault.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-2">No evidence captured yet.</p>
            ) : vault.map(e => (
              <div key={e.id} className="flex items-center justify-between bg-black/40 border border-white/5 rounded-lg px-3 py-2">
                <div>
                  <div className="text-xs text-white font-mono">{e.label}</div>
                  <div className="text-[10px] text-gray-500">{e.timestamp}</div>
                </div>
                <button className="flex items-center gap-1 text-[10px] text-blue-400 border border-blue-500/20 bg-blue-500/10 px-2 py-1 rounded hover:bg-blue-500/20 transition-colors">
                  <Send size={9} /> Send
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
