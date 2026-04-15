/**
 * MapView — the Leaflet map and all its markers.
 *
 * Renders:
 *  - The base tile layer (OpenStreetMap)
 *  - The user's live GPS location marker (when tracking is active)
 *  - All visible permanent site markers with SitePopup
 *  - All visible temporary event markers with TemporarySitePopup
 *  - A long-press handler that triggers the RequestForm
 *
 * The map initializes centered on Omer (from lib/constants) and never
 * changes its initial center prop — subsequent navigation uses mapRef.flyTo().
 *
 * Props:
 *  mapRef          — Leaflet map instance ref (controlled by parent)
 *  markerRefs      — registry ref { "permanent-{id}": marker, "temporary-{id}": marker }
 *  userLocation    — { lat, lng } or null
 *  points          — filtered permanent sites from useFilters
 *  temporarySites  — filtered temporary sites from useFilters
 *  onMarkerClick   — called when a marker is clicked (for search bar sync)
 *  onLongPress     — called with { lat, lng } on a long mouse press
 */

import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import { useRef, useCallback, useMemo } from "react";
import MarkerClusterGroup from "react-leaflet-cluster";
import "react-leaflet-cluster/dist/assets/MarkerCluster.css";
import L from "leaflet";
import { userIcon, getCategoryIcon } from "../lib/leafletIcons";
import { getTemporaryIcon } from "../lib/temporaryIcons";
import { OMER_CENTER } from "../lib/constants";

/** Blue cluster icon — same color regardless of count */
const createClusterIcon = (cluster) =>
  L.divIcon({
    html: `<div style="
      width:38px;height:38px;background:#1a6fbd;border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      color:#fff;font-weight:700;font-size:14px;
      border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.35);
    ">${cluster.getChildCount()}</div>`,
    className: "",
    iconSize: L.point(38, 38),
  });
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

  useMapEvents({
    mousedown: handleMouseDown,
    mouseup: handleMouseUp,
    dragstart: handleMouseUp,
  });

  return null;
}

export default function MapView({ mapRef, markerRefs, userLocation, points, temporarySites = [], onMarkerClick, onLongPress }) {
  // Stable ref callback — not recreated on every render, prevents unnecessary updates while dragging
  const setMarkerRef = useCallback((el, key) => {
    markerRefs.current[key] = el;
  }, [markerRefs]);

  return (
    <MapContainer center={OMER_CENTER} zoom={15} zoomControl={false} style={{ height: "100%", width: "100%" }} ref={mapRef}>
      <TileLayer attribution="© OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {/* Long press handler for adding new requests */}
      {onLongPress && <MapLongPressHandler onLongPress={onLongPress} />}

      {/* User GPS location — not clustered, always shown individually */}
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

      {/* Permanent Sites — clustered, memoized so markers only re-render when data changes */}
      <MarkerClusterGroup chunkedLoading disableClusteringAtZoom={19} maxClusterRadius={50} iconCreateFunction={createClusterIcon}>
        {useMemo(() => points.map((p) => (
          <Marker
            key={`permanent-${p.id}`}
            position={[p.lat, p.lng]}
            icon={getCategoryIcon(p.subCategory)}
            ref={(el) => setMarkerRef(el, `permanent-${p.id}`)}
            eventHandlers={{
              click: (e) => {
                L.DomEvent.stopPropagation(e);
                onMarkerClick(p);
              },
            }}
          >
            <Popup autoPan={false}>
              <SitePopup site={p} />
            </Popup>
          </Marker>
        )), [points, onMarkerClick, setMarkerRef])}
      </MarkerClusterGroup>

      {/* Temporary Sites — clustered separately */}
      <MarkerClusterGroup chunkedLoading disableClusteringAtZoom={19} maxClusterRadius={50} iconCreateFunction={createClusterIcon}>
        {useMemo(() => temporarySites.map((t) => (
          <Marker
            key={`temporary-${t.id}`}
            position={[t.lat, t.lng]}
            icon={getTemporaryIcon(t.priority)}
            ref={(el) => setMarkerRef(el, `temporary-${t.id}`)}
            eventHandlers={{
              click: (e) => {
                L.DomEvent.stopPropagation(e);
              },
            }}
          >
            <Popup autoPan={false}>
              <TemporarySitePopup site={t} />
            </Popup>
          </Marker>
        )), [temporarySites, setMarkerRef])}
      </MarkerClusterGroup>

    </MapContainer>
  );
}