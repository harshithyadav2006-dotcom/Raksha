import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Shield, Phone, MapPin } from 'lucide-react';

// Blue marker for police stations
const blueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

const STATIONS = [
  { id: 1, name: 'Indiranagar PS', dist: '0.8 km', phone: '080-2294-2541', hours: '24/7', lat: 12.9784, lng: 77.6408, query: 'Indiranagar Police Station, Bengaluru' },
  { id: 2, name: 'Koramangala PS', dist: '1.4 km', phone: '080-2553-7777', hours: '24/7', lat: 12.9352, lng: 77.6245, query: 'Koramangala Police Station, Bengaluru' },
  { id: 3, name: 'Cubbon Park PS', dist: '2.1 km', phone: '080-2294-2591', hours: '24/7', lat: 12.9758, lng: 77.6096, query: 'Cubbon Park Police Station, Bengaluru' },
  { id: 4, name: 'Jayanagar PS', dist: '3.0 km', phone: '080-2294-2566', hours: '24/7', lat: 12.9250, lng: 77.5938, query: 'Jayanagar Police Station, Bengaluru' },
];

export const PoliceLocator: React.FC = () => {
  return (
    <div className="liquid-glass border border-white/10 rounded-xl p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-wider flex items-center gap-2">
          <Shield size={14} className="text-blue-400" /> NEARBY POLICE STATIONS
        </h3>
        <span className="text-[10px] text-gray-400">4 Stations Nearby</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        {/* 2x2 Grid of Stations */}
        <div className="grid grid-cols-2 gap-3">
          {STATIONS.map(s => (
            <div key={s.id} className="liquid-glass border border-white/10 rounded-xl p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1 gap-1">
                  <span className="text-xs font-semibold text-white truncate">{s.name}</span>
                  <span className="text-[8px] text-green-400 border border-green-500/30 bg-green-500/10 px-1.5 py-0.5 rounded shrink-0">{s.hours}</span>
                </div>
                <div className="text-[10px] text-blue-400 font-mono mb-1">{s.dist} away</div>
                <div className="text-[10px] text-gray-400 font-mono mb-3">{s.phone}</div>
              </div>
              <div className="flex gap-2">
                <a href={`tel:${s.phone}`} className="flex-1 flex items-center justify-center gap-1 text-[10px] font-bold bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 rounded-lg py-1.5 transition-colors">
                  <Phone size={10} /> Call
                </a>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.query)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1 text-[10px] font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg py-1.5 transition-colors"
                >
                  <MapPin size={10} /> Map
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Map */}
        <div className="h-[220px] lg:h-auto rounded-xl overflow-hidden border border-white/5 min-h-[220px]">
          <MapContainer center={[12.9550, 77.6300]} zoom={12} style={{ height: '100%', width: '100%' }} zoomControl={false} attributionControl={false}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
            {STATIONS.map(s => (
              <Marker key={s.id} position={[s.lat, s.lng]} icon={blueIcon}>
                <Popup>
                  <div className="text-black text-xs">
                    <strong>{s.name}</strong><br />{s.dist} · {s.phone}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};
