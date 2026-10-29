import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Search, Navigation, Loader2 } from 'lucide-react';

const pickerIcon = L.divIcon({
  className: 'custom-picker-pin',
  html: `
    <div style="
      width: 36px;
      height: 36px;
      background: #C7834B;
      border: 3px solid #FFFFFF;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 14px rgba(36,23,17,0.4);
      color: #FFFFFF;
      font-size: 16px;
    ">
      📍
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapCenterController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 15, { animate: true });
  }, [center, map]);
  return null;
}

interface LocationPickerMapProps {
  initialLat?: number;
  initialLng?: number;
  onSelectCoordinates: (lat: number, lng: number, addressHint?: string) => void;
  height?: string;
}

export const LocationPickerMap: React.FC<LocationPickerMapProps> = ({
  initialLat = 26.6343, // Birtamode Muktichowk
  initialLng = 87.9863,
  onSelectCoordinates,
  height = '320px',
}) => {
  const [coords, setCoords] = useState<[number, number]>([initialLat, initialLng]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);

  const handleMapClick = (lat: number, lng: number) => {
    setCoords([lat, lng]);
    onSelectCoordinates(lat, lng);
  };

  const handleMarkerDrag = (e: L.DragEndEvent) => {
    const marker = e.target;
    const position = marker.getLatLng();
    setCoords([position.lat, position.lng]);
    onSelectCoordinates(position.lat, position.lng);
  };

  // Safe client-side geocoding helper biased to Nepal
  const handleGeocode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setIsSearching(true);
      setGeocodeError(null);
      const query = encodeURIComponent(`${searchQuery.trim()}, Jhapa, Nepal`);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        setCoords([lat, lon]);
        onSelectCoordinates(lat, lon, data[0].display_name);
      } else {
        setGeocodeError('Location not found. Please click directly on the map or drag the pin.');
      }
    } catch {
      setGeocodeError('Geocoding service unavailable. You can click on the map to place your pin manually.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-2">
      {/* Search & Assist Bar */}
      <div className="flex gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search landmark in Jhapa (e.g. Muktichowk, Damak Chowk)..."
          className="flex-1 text-xs p-2.5 rounded-xl border border-latte bg-cream-50/50 text-espresso focus:outline-none focus:border-caramel"
        />
        <button
          type="button"
          onClick={handleGeocode}
          disabled={isSearching}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-espresso text-cream hover:bg-espresso-700 shadow-warm flex items-center gap-1.5"
        >
          {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
          <span>Find</span>
        </button>
      </div>

      {geocodeError && (
        <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
          {geocodeError}
        </p>
      )}

      {/* Leaflet Interactive Map */}
      <div className="relative rounded-2xl overflow-hidden border border-latte/80 shadow-warm" style={{ height }}>
        <MapContainer
          center={coords}
          zoom={14}
          scrollWheelZoom={false}
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapCenterController center={coords} />
          <MapClickHandler onLocationSelect={handleMapClick} />
          <Marker
            position={coords}
            icon={pickerIcon}
            draggable={true}
            eventHandlers={{ dragend: handleMarkerDrag }}
          />
        </MapContainer>

        <div className="absolute bottom-2 left-2 z-[1000] bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[10px] font-mono text-espresso border border-latte shadow-sm">
          Lat: {coords[0].toFixed(5)}, Lng: {coords[1].toFixed(5)} (Click or drag pin)
        </div>
      </div>
    </div>
  );
};

