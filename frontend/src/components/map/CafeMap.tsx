import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { Cafe } from '../../types';
import { StarRating } from '../common/StarRating';
import { Navigation, MapPin } from 'lucide-react';
import { useLocation } from '../../context/LocationContext';

// Custom Coffee Marker Icon
const createCoffeeIcon = (isSelected: boolean) => {
  return L.divIcon({
    className: 'custom-coffee-pin',
    html: `
      <div style="
        width: ${isSelected ? '38px' : '32px'};
        height: ${isSelected ? '38px' : '32px'};
        background: ${isSelected ? '#C7834B' : '#241711'};
        border: 2px solid #FFFFFF;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(36,23,17,0.35);
        color: #F8F3EA;
        font-size: ${isSelected ? '16px' : '14px'};
        cursor: pointer;
        transition: transform 0.2s ease;
      ">
        ☕
      </div>
    `,
    iconSize: [isSelected ? 38 : 32, isSelected ? 38 : 32],
    iconAnchor: [isSelected ? 19 : 16, isSelected ? 19 : 16],
    popupAnchor: [0, -18],
  });
};

// Component to dynamically recenter map
function MapRecenter({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  return null;
}

interface CafeMapProps {
  cafes: Cafe[];
  selectedCafeId?: number | null;
  onSelectCafe?: (cafe: Cafe) => void;
  height?: string;
  defaultCenter?: [number, number];
  defaultZoom?: number;
}

export const CafeMap: React.FC<CafeMapProps> = ({
  cafes,
  selectedCafeId,
  onSelectCafe,
  height = '500px',
  defaultCenter = [26.6343, 87.9863], // Birtamode Muktichowk
  defaultZoom = 14,
}) => {
  const { userCoords, requestUserLocation, isLocating } = useLocation();
  const [center, setCenter] = useState<[number, number]>(defaultCenter);
  const [zoom, setZoom] = useState<number>(defaultZoom);

  useEffect(() => {
    if (selectedCafeId) {
      const match = cafes.find((c) => c.id === selectedCafeId);
      if (match && match.latitude && match.longitude) {
        setCenter([Number(match.latitude), Number(match.longitude)]);
        setZoom(16);
      }
    } else if (cafes.length > 0 && cafes[0].latitude) {
      setCenter([Number(cafes[0].latitude), Number(cafes[0].longitude)]);
    }
  }, [selectedCafeId, cafes]);

  const handleLocateMe = async () => {
    const coords = await requestUserLocation();
    if (coords) {
      setCenter([coords.lat, coords.lng]);
      setZoom(15);
    }
  };

  return (
    <div className="relative rounded-2xl overflow-hidden border border-latte/60 shadow-warm" style={{ height }}>
      {/* Geolocation Button */}
      <div className="absolute top-4 right-4 z-[1000]">
        <button
          type="button"
          onClick={handleLocateMe}
          disabled={isLocating}
          title="Center on my location"
          className="glass-panel px-3.5 py-2 rounded-xl text-xs font-semibold text-espresso shadow-md hover:bg-white active:scale-95 transition-all flex items-center gap-1.5 focus:outline-none"
        >
          <Navigation className={`w-3.5 h-3.5 text-caramel ${isLocating ? 'animate-spin' : ''}`} />
          <span>{isLocating ? 'Locating...' : 'Near Me'}</span>
        </button>
      </div>

      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapRecenter center={center} zoom={zoom} />

        {/* User location marker if permitted */}
        {userCoords && (
          <Marker
            position={[userCoords.lat, userCoords.lng]}
            icon={L.divIcon({
              className: 'user-location-pin',
              html: `
                <div style="width: 18px; height: 18px; background: #3B82F6; border: 3px solid #FFFFFF; border-radius: 50%; box-shadow: 0 0 10px rgba(59,130,246,0.6);"></div>
              `,
              iconSize: [18, 18],
              iconAnchor: [9, 9],
            })}
          >
            <Popup>
              <div className="p-2 text-xs font-semibold text-espresso">
                📍 You are here
              </div>
            </Popup>
          </Marker>
        )}

        {/* Cafe Markers */}
        {cafes.map((cafe) => {
          if (!cafe.latitude || !cafe.longitude) return null;
          const isSelected = cafe.id === selectedCafeId;
          const pos: [number, number] = [Number(cafe.latitude), Number(cafe.longitude)];

          return (
            <Marker
              key={cafe.id}
              position={pos}
              icon={createCoffeeIcon(isSelected)}
              eventHandlers={{
                click: () => {
                  if (onSelectCafe) onSelectCafe(cafe);
                },
              }}
            >
              <Popup>
                <div className="w-56 overflow-hidden">
                  {cafe.cover_image_url && (
                    <div className="h-28 w-full overflow-hidden bg-cream-100">
                      <img
                        src={cafe.cover_image_url}
                        alt={cafe.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-3">
                    <h4 className="font-serif text-sm font-bold text-espresso line-clamp-1">
                      {cafe.name}
                    </h4>
                    <div className="mt-1 flex items-center justify-between">
                      <StarRating rating={cafe.average_rating} size="sm" showScore={true} />
                      <span className="text-[10px] font-semibold text-caramel uppercase">
                        {cafe.price_range}
                      </span>
                    </div>
                    <p className="text-[11px] text-subtext truncate mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-caramel flex-shrink-0" />
                      <span>{cafe.address}</span>
                    </p>
                    <div className="mt-2.5 pt-2 border-t border-latte/40 flex justify-between items-center">
                      <Link
                        to={`/cafes/${cafe.slug}`}
                        className="text-xs font-bold text-caramel hover:text-espresso transition-colors"
                      >
                        View Profile →
                      </Link>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${cafe.latitude},${cafe.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-subtext hover:text-espresso underline"
                      >
                        Directions
                      </a>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

