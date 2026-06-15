import React, { useState, useEffect, useRef } from 'react';
import { Mic, Folder } from 'lucide-react';
import toast from 'react-hot-toast';

interface Recording { id: number; timestamp: string; duration: string; }

interface Props { className?: string; }

export const AudioRecording: React.FC<Props> = ({ className = '' }) => {
  const [enabled, setEnabled] = useState(false);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [showVault, setShowVault] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const saveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const stopAll = () => {
    mediaRef.current?.stop();
    mediaRef.current = null;
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (saveRef.current) clearInterval(saveRef.current);
    setElapsed(0);
  };

  useEffect(() => {
    if (!enabled) { stopAll(); return; }

    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      const mr = new MediaRecorder(stream);
      mediaRef.current = mr;
      mr.start();
      startTimeRef.current = Date.now();

      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);

      saveRef.current = setInterval(() => {
        const dur = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const mins = Math.floor(dur / 60), secs = dur % 60;
        setRecordings(prev => [{
          id: Date.now(),
          timestamp: new Date().toLocaleTimeString(),
          duration: `${mins}m ${secs}s`
        }, ...prev].slice(0, 20));
        startTimeRef.current = Date.now();
      }, 60000);
    }).catch(() => {
      toast.error('Microphone permission denied', { style: { background: '#1a1a1a', border: '1px solid #ef4444', color: '#fff' } });
      setEnabled(false);
    });

    return () => stopAll();
  }, [enabled]);

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <>
      {/* Subtle pulsing dot when recording */}
      {enabled && (
        <div className="fixed top-14 right-20 z-[200] w-2 h-2 rounded-full bg-red-500/60 animate-pulse pointer-events-none" title="Recording" />
      )}

      <div className={`liquid-glass border border-white/10 rounded-xl p-5 flex flex-col justify-between ${className}`}>
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold tracking-wider flex items-center gap-2">
                <Mic size={14} className={enabled ? 'text-red-400' : 'text-gray-400'} /> SILENT RECORDING MODE
              </h3>
              <p className="text-[10px] text-gray-500 mt-0.5">Records audio silently. Auto-saves every 60 seconds.</p>
            </div>
            <button
              onClick={() => setEnabled(e => !e)}
              className={`w-12 h-6 rounded-full relative transition-colors ${enabled ? 'bg-red-500/30 border border-red-500/50' : 'bg-white/10 border border-white/10'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full transition-all ${enabled ? 'right-0.5 bg-red-400' : 'left-0.5 bg-gray-500'}`} />
            </button>
          </div>

          {enabled && (
            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2 mb-4 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
              <span className="text-xs text-red-400 font-mono">REC {fmt(elapsed)}</span>
              <span className="text-[10px] text-gray-500 ml-auto">Next save in {60 - (elapsed % 60)}s</span>
            </div>
          )}
        </div>

        <div className="mt-auto pt-2">
          <button
            onClick={() => setShowVault(v => !v)}
            className="flex items-center gap-2 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-2 transition-colors w-full justify-center"
          >
            <Folder size={13} /> View Vault ({recordings.length} entries)
          </button>

          {showVault && recordings.length > 0 && (
            <div className="mt-3 flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">
              {recordings.map(r => (
                <div key={r.id} className="flex items-center justify-between bg-black/40 border border-white/5 rounded-lg px-3 py-2">
                  <div>
                    <div className="text-xs text-white font-mono">{r.timestamp}</div>
                    <div className="text-[10px] text-gray-500">{r.duration}</div>
                  </div>
                  <span className="text-[10px] text-red-400 border border-red-500/20 bg-red-500/10 px-2 py-0.5 rounded">ENCRYPTED</span>
                </div>
              ))}
            </div>
          )}
          {showVault && recordings.length === 0 && (
            <p className="text-xs text-gray-500 text-center mt-3">No recordings yet. Enable recording to start.</p>
          )}
        </div>
      </div>
    </>
  );
};
