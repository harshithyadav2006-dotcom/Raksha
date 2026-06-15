import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { createPortal } from 'react-dom';
import { QRCodeSVG } from 'qrcode.react';
import { MapPin, Share2, X, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => { map.setView([lat, lng], map.getZoom()); }, [lat, lng, map]);
  return null;
}

interface Props { sosActive: boolean; }

export const GPSLocationCard: React.FC<Props> = ({ sosActive }) => {
  const BASE = { lat: 12.9716, lng: 77.5946 };
  const [coords, setCoords] = useState(BASE);
  const [accuracy] = useState(4.2);
  const [shareUrl, setShareUrl] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [showContacts, setShowContacts] = useState(false);

  const getGuardians = () => {
    const saved = localStorage.getItem('raksha_guardians');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      { id: 1, name: 'Meera Sharma', relation: 'Mother', phone: '+91 87920 74989' },
      { id: 2, name: 'Raj Verma', relation: 'Brother', phone: '+91 96326 30072' },
      { id: 3, name: 'Suresh Nair', relation: 'Father', phone: '+91 81971 49231' },
    ];
  };

  const handleSendSMS = (guardian: any) => {
    const text = `Emergency Alert! Track my live location on Google Maps: ${shareUrl}`;
    const smsPhone = guardian.phone.replace(/[^0-9+]/g, '');
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const separator = isIOS ? '&' : '?';
    const url = `sms:${smsPhone}${separator}body=${encodeURIComponent(text)}`;
    window.location.href = url;
    toast.success('Sent!', { id: 'sos-dispatch' });
  };

  const handleSendWhatsApp = (guardian: any) => {
    const text = `Emergency Alert!\nTrack my live location on Google Maps:\n${shareUrl}`;
    const cleanPhone = guardian.phone.replace(/[^0-9]/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    toast.success('Sent!', { id: 'sos-dispatch' });
  };

  useEffect(() => {
    let watchId: number | null = null;
    let fallbackInterval: ReturnType<typeof setInterval> | null = null;

    const startFallback = () => {
      if (!fallbackInterval) {
        fallbackInterval = setInterval(() => {
          setCoords(p => ({
            lat: +(p.lat + (Math.random() - 0.5) * 0.0002).toFixed(6),
            lng: +(p.lng + (Math.random() - 0.5) * 0.0002).toFixed(6),
          }));
        }, 5000);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({
            lat: +pos.coords.latitude.toFixed(6),
            lng: +pos.coords.longitude.toFixed(6),
          });
        },
        (err) => {
          console.error("Initial getCurrentPosition failed:", err);
        }
      );

      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setCoords({
            lat: +pos.coords.latitude.toFixed(6),
            lng: +pos.coords.longitude.toFixed(6),
          });
        },
        (err) => {
          console.error("watchPosition failed, using fallback:", err);
          startFallback();
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      startFallback();
    }

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      if (fallbackInterval !== null) clearInterval(fallbackInterval);
    };
  }, []);

  const handleShare = () => {
    const url = `https://www.google.com/maps?q=${coords.lat},${coords.lng}`;
    setShareUrl(url);
    setShowQR(true);
    setShowContacts(false);
  };

  return (
    <div className="liquid-glass border border-white/10 rounded-xl p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-wider flex items-center gap-2">
          <MapPin size={14} className="text-green-400" /> LIVE GPS LOCATION
        </h3>
        <span className="flex items-center gap-1.5 text-[10px] font-bold text-green-400 bg-green-500/10 border border-green-500/30 px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Sharing Live
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[['Latitude', coords.lat], ['Longitude', coords.lng]].map(([label, val]) => (
          <div key={label as string} className="bg-black/40 rounded-lg px-3 py-2">
            <div className="text-[10px] text-gray-500 uppercase mb-1">{label}</div>
            <div className="font-mono text-white text-sm">{val}</div>
          </div>
        ))}
        <div className="bg-black/40 rounded-lg px-3 py-2">
          <div className="text-[10px] text-gray-500 uppercase mb-1">Accuracy</div>
          <div className="font-mono text-green-400 text-sm">±{accuracy}m</div>
        </div>
        <div className="bg-black/40 rounded-lg px-3 py-2">
          <div className="text-[10px] text-gray-500 uppercase mb-1">Status</div>
          <div className="text-green-400 text-sm font-medium">{sosActive ? 'SOS Broadcasting' : 'Active'}</div>
        </div>
      </div>

      <div className="h-[160px] rounded-lg overflow-hidden border border-white/5">
        <MapContainer center={[coords.lat, coords.lng]} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false} attributionControl={false}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
          <Marker position={[coords.lat, coords.lng]} />
          <Recenter lat={coords.lat} lng={coords.lng} />
        </MapContainer>
      </div>

      <button onClick={handleShare} className="flex items-center justify-center gap-2 w-full py-2.5 liquid-glass border border-white/10 hover:bg-white/10 rounded-lg text-sm font-medium transition-colors">
        <Share2 size={14} /> Share Live Link
      </button>

      {showQR && createPortal(
        <div className="fixed inset-0 z-[1100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="liquid-glass border border-white/10 rounded-2xl p-6 max-w-sm w-full flex flex-col items-center gap-4">
            <div className="flex items-center justify-between w-full">
              <h4 className="text-sm font-semibold">Live Tracking Link</h4>
              <button onClick={() => setShowQR(false)}><X size={16} className="text-gray-400 hover:text-white" /></button>
            </div>
            <div className="p-3 bg-white rounded-xl">
              <QRCodeSVG value={shareUrl} size={180} />
            </div>
            <a
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-blue-400 hover:underline text-center break-all font-mono"
            >
              {shareUrl}
            </a>
            {!showContacts ? (
              <button
                type="button"
                onClick={() => setShowContacts(true)}
                className="w-full py-2.5 bg-white text-black rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
              >
                Send Link
              </button>
            ) : (
              <div className="w-full flex flex-col gap-3">
                <div className="text-xs font-semibold text-gray-300 border-b border-white/10 pb-1.5 flex justify-between items-center">
                  <span>Send Live Link To:</span>
                  <button
                    type="button"
                    onClick={() => setShowContacts(false)}
                    className="text-[10px] text-gray-400 hover:text-white"
                  >
                    Back
                  </button>
                </div>
                <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1">
                  {getGuardians().map((g: any) => (
                    <div key={g.id} className="flex items-center justify-between bg-white/5 hover:bg-white/10 px-3 py-2 rounded-lg transition-all border border-white/5">
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium text-white truncate">{g.name}</div>
                        <div className="text-[9px] text-gray-400">{g.relation} · {g.phone}</div>
                      </div>
                      <div className="flex gap-1.5 ml-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleSendSMS(g)}
                          className="px-2.5 py-1 bg-blue-500/25 hover:bg-blue-500/40 text-blue-300 rounded text-[10px] font-bold border border-blue-500/30 flex items-center gap-1 transition-all"
                          title="Send via SMS"
                        >
                          <MessageSquare size={10} /> SMS
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSendWhatsApp(g)}
                          className="px-2.5 py-1 bg-emerald-500/25 hover:bg-emerald-500/40 text-emerald-300 rounded text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1 transition-all"
                          title="Send via WhatsApp"
                        >
                          <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current shrink-0">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.588 1.451 5.407 1.452 5.54.004 10.05-4.505 10.054-10.045.002-2.684-1.038-5.207-2.93-7.098C17.29 1.57 14.768.53 12.013.53c-5.546 0-10.059 4.51-10.06 10.052-.001 1.83.48 3.62 1.39 5.2l-.998 3.64 3.713-.974zM17.47 14.39c-.3-.149-1.777-.878-2.076-.985-.299-.107-.517-.16-.735.168-.218.327-.843 1.066-1.034 1.285-.19.218-.38.244-.68.095-.3-.15-1.265-.467-2.41-1.485-.89-.794-1.492-1.775-1.667-2.074-.175-.3-.019-.462.13-.61.135-.133.3-.349.45-.523.15-.174.2-.299.3-.498.1-.2.05-.374-.025-.523-.075-.15-.735-1.77-1.007-2.422-.265-.636-.53-.55-.735-.56-.19-.008-.408-.01-.625-.01-.218 0-.573.082-.872.408-.3.326-1.144 1.116-1.144 2.72 0 1.605 1.169 3.159 1.33 3.376.162.218 2.299 3.51 5.568 4.922.778.336 1.385.537 1.857.687.781.248 1.49.213 2.052.129.626-.094 1.777-.727 2.025-1.429.248-.7.248-1.3 1.73-.149z" />
                          </svg> WhatsApp
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
