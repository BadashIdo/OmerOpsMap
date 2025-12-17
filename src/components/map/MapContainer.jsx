import React, { useEffect, useRef, useState } from 'react';
import { MapContainer as LeafletMap, TileLayer, Marker, Popup, useMap, ZoomControl, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation } from 'lucide-react';

const OMER_CENTER = [31.2647, 34.8497];
const OMER_ZOOM = 14;

const CATEGORY_COLORS = {
  operations: '#3B82F6',
  community: '#22C55E',
  emergency: '#EF4444',
};

const SUB_CATEGORY_CONFIG = {
  // תפעול
  waste_centers: { icon: '🗑️', color: '#3B82F6' },
  recycling: { icon: '♻️', color: '#3B82F6' },
  sweeping_routes: { icon: '🧹', color: '#3B82F6' },
  pruning_stations: { icon: '🌿', color: '#3B82F6' },
  leisure: { icon: '🌳', color: '#3B82F6' },
  // קהילה ותרבות
  upcoming_events: { icon: '📅', color: '#22C55E' },
  education: { icon: '🎒', color: '#22C55E' },
  sports: { icon: '💪', color: '#22C55E' },
  // חירום וביטחון
  public_shelters: { icon: '🛡️', color: '#EF4444' },
  emergency_alerts: { icon: '🚨', color: '#EF4444' },
};

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function createCustomIcon(subCategory) {
  const config = SUB_CATEGORY_CONFIG[subCategory] || { icon: '📍', color: '#6B7280' };
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${config.color};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        font-size: 16px;
      ">
        ${config.icon}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

function MapController({ selectedSite, mapRef }) {
  const map = useMap();
  
  useEffect(() => {
    if (mapRef) {
      mapRef.current = map;
    }
  }, [map, mapRef]);
  
  useEffect(() => {
    if (selectedSite) {
      map.flyTo([selectedSite.latitude, selectedSite.longitude], 17, {
        duration: 1
      });
    }
  }, [selectedSite, map]);
  
  return null;
}

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng);
    },
  });
  return null;
}

export default function MapContainer({ sites, selectedLayers, onMarkerClick, selectedSite, onMapClick }) {
  const [userLocation, setUserLocation] = useState(null);
  const mapRef = useRef(null);

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ latitude, longitude });
          if (mapRef.current) {
            mapRef.current.flyTo([latitude, longitude], 17, { duration: 1 });
          }
        },
        (error) => {
          alert('לא ניתן לגשת למיקום שלך. אנא ודא שנתת הרשאה לדפדפן.');
        }
      );
    } else {
      alert('הדפדפן שלך לא תומך בשירותי מיקום.');
    }
  };

  const filteredSites = sites.filter(site => 
    selectedLayers.includes(site.sub_category) && site.latitude && site.longitude
  );

  const userLocationIcon = L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: #3b82f6;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 4px solid white;
        box-shadow: 0 0 0 2px #3b82f6, 0 2px 8px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  return (
    <div className="relative w-full h-full">
      <LeafletMap
        center={OMER_CENTER}
        zoom={OMER_ZOOM}
        zoomControl={false}
        className="w-full h-full z-0"
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <ZoomControl position="bottomleft" />
        
        {userLocation && (
          <Marker
            position={[userLocation.latitude, userLocation.longitude]}
            icon={userLocationIcon}
          >
            <Popup>
              <div className="text-center" dir="rtl">
                <strong>המיקום שלי</strong>
              </div>
            </Popup>
          </Marker>
        )}
      
      {filteredSites.map((site) => (
        <Marker
          key={site.id}
          position={[site.latitude, site.longitude]}
          icon={createCustomIcon(site.sub_category)}
          eventHandlers={{
            click: () => onMarkerClick(site),
          }}
        >
          <Popup>
            <div className="text-center" dir="rtl">
              <strong>{site.name}</strong>
              {site.address && <div className="text-sm">{site.address}</div>}
            </div>
          </Popup>
        </Marker>
      ))}

        <MapController selectedSite={selectedSite} mapRef={mapRef} />
        <MapClickHandler onMapClick={onMapClick} />
      </LeafletMap>

      <button
        onClick={handleLocateMe}
        className="absolute bottom-40 left-2 z-[1000] bg-white hover:bg-gray-50 border-2 border-gray-300 rounded-md shadow-md w-8 h-8 flex items-center justify-center transition-colors"
        title="המיקום שלי"
      >
        <Navigation className="w-5 h-5 text-gray-700" />
      </button>
    </div>
  );
}