import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import { useRef, useCallback } from "react";
import L from "leaflet";
import { userIcon, getCategoryIcon } from "../lib/leafletIcons";
import { getTemporaryIcon } from "../lib/temporaryIcons";
import SitePopup from "./Site/SitePopup";
import TemporarySitePopup from "./Site/TemporarySitePopup";

// Component to handle map long press events
function MapLongPressHandler({ onLongPress }) {
  const pressTimerRef = useRef(null);
  const pressLocationRef = useRef(null);
  const LONG_PRESS_DURATION = 600; // ms

  const handleMouseDown = useCallback((e) => {
    pressLocationRef.current = e.latlng;
    pressTimerRef.current = setTimeout(() => {
      if (onLongPress && pressLocationRef.current) {
        onLongPress({
          lat: pressLocationRef.current.lat,
          lng: pressLocationRef.current.lng,
        });
      }
    }, LONG_PRESS_DURATION);
  }, [onLongPress]);

  const handleMouseUp = useCallback(() => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  }, []);

  const handleMouseMove = useCallback(() => {
    // Cancel if mouse moves during press
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  }, []);

  useMapEvents({
    mousedown: handleMouseDown,
    mouseup: handleMouseUp,
    mousemove: handleMouseMove,
    dragstart: handleMouseUp,
  });

  return null;
}

function MapClickPicker({ isEnabled, onPickLocationClick }) {
  useMapEvents({
    click: (e) => {
      if (!isEnabled || !onPickLocationClick) return;
      onPickLocationClick({
        lat: e.latlng.lat,
        lng: e.latlng.lng,
      });
    },
  });

  return null;
}


export default function MapView({
  center,
  mapRef,
  markerRefs,
  userLocation,
  points,
  temporarySites = [],
  onMarkerClick,
  onLongPress,
  isAdmin = false,
  onEditPermanentSite,
  isPickingLocation = false,
  onPickLocationClick,
}) {
  return (
    <MapContainer center={center} zoom={15} zoomControl={false} style={{ height: "100%", width: "100%" }} ref={mapRef}>
      <TileLayer attribution="© OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      
      {/* Long press handler for adding new requests */}
      {onLongPress && <MapLongPressHandler onLongPress={onLongPress} />}
      <MapClickPicker isEnabled={isPickingLocation} onPickLocationClick={onPickLocationClick} />

      {userLocation && (
        <Marker position={userLocation} icon={userIcon}>
          <Popup>
            <div style={{ textAlign: "center", direction: "rtl" }}>
              <div style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "5px" }}>
                📍 אתה כאן
              </div>
              <div style={{ fontSize: "12px", opacity: 0.7 }}>
                מיקום בזמן אמת
              </div>
            </div>
          </Popup>
        </Marker>
      )}

      {/* Permanent Sites */}
      {points.map((p) => (
        <Marker
          key={`permanent-${p.id}`}
          position={[p.lat, p.lng]}
          icon={getCategoryIcon(p.subCategory)}
          ref={(el) => (markerRefs.current[`permanent-${p.id}`] = el)}
          eventHandlers={{
            click: (e) => {
              L.DomEvent.stopPropagation(e);
              onMarkerClick(p);
            },
          }}
        >
        <Popup>
            <SitePopup site={p} isAdmin={isAdmin} onEdit={onEditPermanentSite} />
        </Popup>
        </Marker>
      ))}
      
      {/* Temporary Sites */}
      {temporarySites.map((t) => (
        <Marker
          key={`temporary-${t.id}`}
          position={[t.lat, t.lng]}
          icon={getTemporaryIcon(t.priority)}
          ref={(el) => (markerRefs.current[`temporary-${t.id}`] = el)}
          eventHandlers={{
            click: (e) => {
              L.DomEvent.stopPropagation(e);
            },
          }}
        >
        <Popup>
            <TemporarySitePopup site={t} />
        </Popup>
        </Marker>
      ))}
    </MapContainer>
    
  );
}
