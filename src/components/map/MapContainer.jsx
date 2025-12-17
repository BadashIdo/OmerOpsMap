import React, { useEffect } from 'react';
import { MapContainer as LeafletMap, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const OMER_CENTER = [31.2647, 34.8497];
const OMER_ZOOM = 14;

const CATEGORY_COLORS = {
  operations: '#3B82F6',
  community: '#22C55E',
  emergency: '#EF4444',
  culture: '#A855F7',
};

const TYPE_ICONS = {
  education: '🏫',
  sports: '⚽',
  culture: '🎭',
  emergency: '🚨',
  municipal: '🏛️',
  health: '🏥',
  outdoor_gym: '💪',
  playground: '🎠',
  shelter: '🛡️',
  synagogue: '🕍',
  other: '📍',
};

// Component to handle map centering
function MapUpdater({ selectedSite }) {
  const map = useMap();
  
  useEffect(() => {
    if (selectedSite) {
      map.flyTo([selectedSite.latitude, selectedSite.longitude], 17, {
        duration: 1
      });
    }
  }, [selectedSite, map]);
  
  return null;
}

// Create custom marker icons
function createCustomIcon(category, type) {
  const color = CATEGORY_COLORS[category] || '#6B7280';
  const emoji = TYPE_ICONS[type] || '📍';
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        position: relative;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          position: absolute;
          width: 32px;
          height: 32px;
          background: ${color};
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        "></div>
        <span style="
          position: relative;
          font-size: 18px;
          z-index: 1;
        ">${emoji}</span>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}

export default function MapContainer({ sites, selectedLayers, onMarkerClick, selectedSite }) {
  const filteredSites = sites.filter(site => 
    selectedLayers.includes(site.category) &&
    site.latitude && 
    site.longitude
  );

  return (
    <LeafletMap
      center={OMER_CENTER}
      zoom={OMER_ZOOM}
      style={{ width: '100%', height: '100%' }}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {filteredSites.map((site) => (
        <Marker
          key={site.id}
          position={[site.latitude, site.longitude]}
          icon={createCustomIcon(site.category, site.type)}
          eventHandlers={{
            click: () => onMarkerClick(site)
          }}
        >
          <Popup>
            <div style={{ direction: 'rtl', textAlign: 'right' }}>
              <strong>{site.name}</strong>
              {site.address && <p style={{ margin: '4px 0', fontSize: '12px' }}>{site.address}</p>}
            </div>
          </Popup>
        </Marker>
      ))}
      
      <MapUpdater selectedSite={selectedSite} />
    </LeafletMap>
  );
}