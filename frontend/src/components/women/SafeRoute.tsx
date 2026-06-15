import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, Clock, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';

function Recenter({ bounds }: { bounds: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds as any, { padding: [30, 30] });
    }
  }, [bounds, map]);
  return null;
}

const DESTINATIONS = ['Home', 'Office', 'Police Station', 'Hospital', 'School/College', 'Custom…'];

export const SafeRoute: React.FC = () => {
  const [destination, setDestination] = useState(DESTINATIONS[0]);
  const [routeActive, setRouteActive] = useState(true);

  const [pendingDest, setPendingDest] = useState<string | null>(null);
  const [showSetModal, setShowSetModal] = useState(false);
  const [addresses, setAddresses] = useState<{ [key: string]: string }>({
    Home: localStorage.getItem('raksha_addr_Home') || '',
    Office: localStorage.getItem('raksha_addr_Office') || '',
    Hospital: localStorage.getItem('raksha_addr_Hospital') || '',
    'School/College': localStorage.getItem('raksha_addr_School/College') || '',
    'Custom…': localStorage.getItem('raksha_addr_Custom') || '',
  });

  const [currentLoc, setCurrentLoc] = useState<[number, number]>([12.9716, 77.5946]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCurrentLoc([pos.coords.latitude, pos.coords.longitude]);
        },
        (err) => console.error(err)
      );
    }
  }, []);

  const getDestinationCoords = (): [number, number] => {
    if (destination === 'Police Station') {
      return [currentLoc[0] + 0.005, currentLoc[1] + 0.005];
    }
    const addr = addresses[destination];
    if (!addr) {
      return [currentLoc[0] + 0.008, currentLoc[1] + 0.008];
    }
    const parts = addr.split(',').map(p => parseFloat(p.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return [parts[0], parts[1]];
    }
    return [currentLoc[0] + 0.008, currentLoc[1] + 0.008];
  };

  const destCoords = getDestinationCoords();

  const dynamicRoutePoints = React.useMemo((): [number, number][] => {
    const start = currentLoc;
    const end = destCoords;
    const latDiff = end[0] - start[0];
    const lngDiff = end[1] - start[1];
    return [
      start,
      [start[0] + latDiff * 0.25, start[1] + lngDiff * 0.1],
      [start[0] + latDiff * 0.5, start[1] + lngDiff * 0.6],
      [start[0] + latDiff * 0.75, start[1] + lngDiff * 0.8],
      end
    ];
  }, [currentLoc, destCoords]);

  const mapBounds = React.useMemo((): [number, number][] => {
    return [currentLoc, destCoords];
  }, [currentLoc, destCoords]);

  const dynamicUnsafeZones = React.useMemo(() => {
    const latDiff = destCoords[0] - currentLoc[0];
    const lngDiff = destCoords[1] - currentLoc[1];
    return [
      { center: [currentLoc[0] + latDiff * 0.35, currentLoc[1] + lngDiff * 0.4] as [number, number], radius: 150, label: 'High-Risk Area' },
      { center: [currentLoc[0] + latDiff * 0.7, currentLoc[1] + lngDiff * 0.65] as [number, number], radius: 120, label: 'Recent Reports' },
    ];
  }, [currentLoc, destCoords]);

  const calculate = () => {
    setRouteActive(true);
  };

  const safetyScore = 87;
  const scoreColor = safetyScore >= 80 ? 'text-green-400 bg-green-500/20 border-green-500/30'
    : safetyScore >= 60 ? 'text-amber-400 bg-amber-500/20 border-amber-500/30'
    : 'text-red-400 bg-red-500/20 border-red-500/30';

  const handleSafeRoute = () => {
    if (destination !== 'Police Station' && !addresses[destination]) {
      setPendingDest(destination);
      setShowSetModal(true);
    } else {
      const destQuery = destination === 'Police Station'
        ? 'Indiranagar Police Station, Bengaluru'
        : addresses[destination];
      
      window.open(`https://www.google.com/maps/dir/?api=1&origin=current+location&destination=${encodeURIComponent(destQuery)}`, '_blank');
    }
  };

  useEffect(() => {
    window.addEventListener('trigger-safe-route', handleSafeRoute);
    return () => window.removeEventListener('trigger-safe-route', handleSafeRoute);
  }, [destination, addresses]);

  return (
    <div className="liquid-glass border border-white/10 rounded-xl p-5 flex flex-col gap-4">
      <h3 className="text-sm font-semibold tracking-wider flex items-center gap-2">
        <Navigation size={14} className="text-green-400" /> SAFE ROUTE NAVIGATION
      </h3>

      {/* Destination selector */}
      <div className="flex flex-col gap-3">
        <div>
          <label className="text-[10px] text-gray-500 uppercase mb-1.5 block">Quick Select Destination</label>
          <div className="flex gap-2 flex-wrap items-center">
            {['Home', 'Office', 'Police Station', 'Hospital', 'School/College'].map(dest => {
              return (
                <div key={dest} className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (dest === 'Police Station') {
                        setDestination(dest);
                        calculate();
                      } else if (!addresses[dest]) {
                        setPendingDest(dest);
                        setShowSetModal(true);
                      } else {
                        setDestination(dest);
                        calculate();
                      }
                    }}
                    className={`text-[11px] font-medium px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                      destination === dest
                        ? 'bg-green-500/20 border-green-500/60 text-green-300 shadow-[0_0_10px_rgba(34,197,94,0.15)]'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span>{dest}</span>
                  </button>
                  {dest !== 'Police Station' && addresses[dest] && (
                    <button
                      type="button"
                      onClick={() => {
                        setPendingDest(dest);
                        setShowSetModal(true);
                      }}
                      className="p-1 hover:bg-white/10 rounded-md text-[9px] text-gray-400 hover:text-white transition-colors"
                      title={`Edit ${dest} Address`}
                    >
                      <Edit2 size={9} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          {destination !== 'Police Station' && addresses[destination] && (
            <div className="text-[10px] text-green-400/80 mt-2 font-mono flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-green-400" />
              Active Destination: {addresses[destination]}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-[10px] text-gray-500 uppercase mb-1 block">Or Choose Custom</label>
            <select
              value={destination}
              onChange={e => {
                const val = e.target.value;
                setDestination(val);
                if (val !== 'Police Station' && !addresses[val]) {
                  setPendingDest(val);
                  setShowSetModal(true);
                } else {
                  calculate();
                }
              }}
              className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-green-500/50"
            >
              {DESTINATIONS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="flex items-end shrink-0">
            <button
              onClick={handleSafeRoute}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 h-[34px]"
            >
              <Navigation size={12} /> SAFE ROUTE
            </button>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="h-[220px] rounded-xl overflow-hidden border border-white/5 relative">
        <MapContainer center={currentLoc} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false} attributionControl={false}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
          {dynamicUnsafeZones.map((z, i) => (
            <Circle key={i} center={z.center} radius={z.radius}
              pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.18, weight: 1.5, dashArray: '6 4' }} />
          ))}
          {routeActive && (
            <Polyline positions={dynamicRoutePoints}
              pathOptions={{ color: '#22c55e', weight: 4, opacity: 0.85, dashArray: '12 6' }} />
          )}
          <Recenter bounds={mapBounds} />
        </MapContainer>
        {/* Legend */}
        <div className="absolute bottom-3 left-3 z-[400] flex gap-3 text-[10px]">
          <span className="flex items-center gap-1 bg-black/70 px-2 py-1 rounded-md backdrop-blur">
            <span className="w-3 border-t-2 border-green-400 border-dashed inline-block" /> Safe Route
          </span>
          <span className="flex items-center gap-1 bg-black/70 px-2 py-1 rounded-md backdrop-blur">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/50 border border-red-500 inline-block" /> Unsafe Zone
          </span>
        </div>
      </div>

      {/* Route stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-black/40 rounded-lg px-3 py-2 text-center">
          <div className="text-[10px] text-gray-500 uppercase flex items-center justify-center gap-1 mb-1"><Clock size={9} />ETA</div>
          <div className="text-sm font-mono text-white">12 min</div>
        </div>
        <div className="bg-black/40 rounded-lg px-3 py-2 text-center">
          <div className="text-[10px] text-gray-500 uppercase mb-1">Distance</div>
          <div className="text-sm font-mono text-white">2.4 km</div>
        </div>
        <div className={`rounded-lg px-3 py-2 text-center border ${scoreColor}`}>
          <div className="text-[10px] uppercase mb-1 opacity-70">Safety</div>
          <div className="text-sm font-bold">{safetyScore}/100</div>
        </div>
      </div>

      {showSetModal && pendingDest && (
        <div className="fixed inset-0 z-[1100] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="liquid-glass border border-white/10 rounded-2xl p-6 max-w-sm w-full">
            <h4 className="text-sm font-semibold mb-2">Set {pendingDest} Address</h4>
            <p className="text-xs text-gray-400 mb-5 leading-relaxed">
              To calculate safe routes, we need your {pendingDest.toLowerCase()} address. Would you like to use your current GPS location?
            </p>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        const addr = `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
                        localStorage.setItem(`raksha_addr_${pendingDest}`, addr);
                        setAddresses(prev => ({ ...prev, [pendingDest]: addr }));
                        setDestination(pendingDest);
                        setShowSetModal(false);
                        calculate();
                        toast.success(`${pendingDest} set to current GPS location!`);
                      },
                      (err) => {
                        console.error(err);
                        const addr = "12.9716, 77.5946 (Mock GPS)";
                        localStorage.setItem(`raksha_addr_${pendingDest}`, addr);
                        setAddresses(prev => ({ ...prev, [pendingDest]: addr }));
                        setDestination(pendingDest);
                        setShowSetModal(false);
                        calculate();
                        toast.success(`${pendingDest} set to current location (Fallback)!`);
                      }
                    );
                  } else {
                    const addr = "12.9716, 77.5946 (Mock GPS)";
                    localStorage.setItem(`raksha_addr_${pendingDest}`, addr);
                    setAddresses(prev => ({ ...prev, [pendingDest]: addr }));
                    setDestination(pendingDest);
                    setShowSetModal(false);
                    calculate();
                    toast.success(`${pendingDest} set to current location (Mock GPS)!`);
                  }
                }}
                className="w-full py-2.5 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 transition-colors"
              >
                Yes, Use Current Location
              </button>
              
              <button
                type="button"
                onClick={() => {
                  const manual = prompt(`Enter custom address or coordinates for ${pendingDest}:`);
                  if (manual) {
                    localStorage.setItem(`raksha_addr_${pendingDest}`, manual);
                    setAddresses(prev => ({ ...prev, [pendingDest]: manual }));
                    setDestination(pendingDest);
                    setShowSetModal(false);
                    calculate();
                    toast.success(`${pendingDest} address updated!`);
                  }
                }}
                className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-lg text-xs font-semibold transition-colors"
              >
                Enter Manually
              </button>
              
              <button
                type="button"
                onClick={() => setShowSetModal(false)}
                className="w-full py-2 bg-transparent text-gray-500 hover:text-gray-300 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
