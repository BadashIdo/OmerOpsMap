import React, { useEffect, useRef } from 'react';
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

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function createCustomIcon(category, type, parkCategory) {
  let color, icon;
  
  if (parkCategory) {
    if (parkCategory === 'גינת כושר') {
      color = '#3b82f6';
      icon = '💪';
    } else if (parkCategory === 'גן ילדים') {
      color = '#ec4899';
      icon = '🎠';
    } else if (parkCategory === 'שטח ציבורי') {
      color = '#22c55e';
      icon = '🌳';
    }
  } else {
    color = CATEGORY_COLORS[category] || '#6B7280';
    icon = TYPE_ICONS[type] || '📍';
  }
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
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
        ${icon}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

function MapController({ selectedSite }) {
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

export default function MapContainer({ sites, parks = [], selectedLayers, onMarkerClick, selectedSite }) {
  const filteredSites = sites.filter(site => 
    selectedLayers.includes(site.category) && site.latitude && site.longitude
  );

  // Parse park coordinates from address field
  const parksWithCoords = parks.map(park => {
    const coordMatch = park.address?.match(/^(\d+\.\d+),\s*(\d+\.\d+)$/);
    if (coordMatch) {
      let layerId;
      if (park.category === 'גינת כושר') layerId = 'park-fitness';
      else if (park.category === 'גן ילדים') layerId = 'park-children';
      else if (park.category === 'שטח ציבורי') layerId = 'park-public';
      
      return {
        ...park,
        latitude: parseFloat(coordMatch[1]),
        longitude: parseFloat(coordMatch[2]),
        layerId
      };
    }
    return null;
  }).filter(park => park !== null);

  const filteredParks = parksWithCoords.filter(park => selectedLayers.includes(park.layerId));

  return (
    <LeafletMap
      center={OMER_CENTER}
      zoom={OMER_ZOOM}
      className="w-full h-full z-0"
      style={{ height: '100%', width: '100%' }}
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

      {filteredParks.map((park) => (
        <Marker
          key={`park-${park.id}`}
          position={[park.latitude, park.longitude]}
          icon={createCustomIcon(null, null, park.category)}
        >
          <Popup>
            <div className="text-center" dir="rtl">
              <strong>{park.name}</strong>
              <div className="text-sm text-gray-600">{park.category}</div>
              {park.symbol && <div className="text-xs text-gray-500">סמל: {park.symbol}</div>}
            </div>
          </Popup>
        </Marker>
      ))}

      <MapController selectedSite={selectedSite} />
    </LeafletMap>
  );
}