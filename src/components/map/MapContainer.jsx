import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

const OMER_CENTER = { lat: 31.2647, lng: 34.8497 };
const OMER_ZOOM = 14;

const CATEGORY_COLORS = {
  operations: '#3B82F6',  // Blue
  community: '#22C55E',   // Green
  emergency: '#EF4444',   // Red
  culture: '#A855F7',     // Purple
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

export default function MapContainer({ sites, selectedLayers, onMarkerClick, selectedSite }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initMap = () => {
      if (!window.google || !mapRef.current) return;

      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: OMER_CENTER,
        zoom: OMER_ZOOM,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      setIsLoading(false);
    };

    if (window.google) {
      initMap();
    } else {
      const checkGoogle = setInterval(() => {
        if (window.google) {
          clearInterval(checkGoogle);
          initMap();
        }
      }, 100);

      setTimeout(() => {
        clearInterval(checkGoogle);
        setIsLoading(false);
      }, 10000);
    }
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !sites) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Filter sites by selected layers
    const filteredSites = sites.filter(site => 
      selectedLayers.includes(site.category)
    );

    // Create new markers
    filteredSites.forEach(site => {
      if (!site.latitude || !site.longitude) return;

      const marker = new window.google.maps.Marker({
        position: { lat: site.latitude, lng: site.longitude },
        map: mapInstanceRef.current,
        title: site.name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: CATEGORY_COLORS[site.category] || '#6B7280',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          scale: 12,
        },
        label: {
          text: TYPE_ICONS[site.type] || '📍',
          fontSize: '14px',
        }
      });

      marker.addListener('click', () => {
        onMarkerClick(site);
      });

      markersRef.current.push(marker);
    });
  }, [sites, selectedLayers, onMarkerClick]);

  useEffect(() => {
    if (selectedSite && mapInstanceRef.current) {
      mapInstanceRef.current.panTo({
        lat: selectedSite.latitude,
        lng: selectedSite.longitude
      });
      mapInstanceRef.current.setZoom(17);
    }
  }, [selectedSite]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-slate-600">טוען מפה...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={mapRef} className="w-full h-full" />
  );
}