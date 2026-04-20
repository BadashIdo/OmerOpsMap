/**
 * LocationPickerMap — fullscreen map overlay for picking a lat/lng point.
 *
 * Behaviour:
 *  - Opens over everything (z-index above the modal)
 *  - Shows a draggable red marker at the current position (or Omer center)
 *  - Clicking anywhere on the map moves the marker there
 *  - Dragging the marker moves it
 *  - "אשר מיקום" confirms and calls onConfirm({ lat, lng })
 *  - "ביטול" calls onCancel
 */

import { useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { OMER_CENTER } from "../../lib/constants";

// Big red pin icon for the picker
const pickerIcon = L.divIcon({
  html: `<div style="
    font-size: 36px;
    line-height: 1;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
    cursor: grab;
  ">📍</div>`,
  className: "",
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

/** Inner component — listens to map clicks and moves the marker */
function ClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export default function LocationPickerMap({ initialLat, initialLng, onConfirm, onCancel }) {
  const defaultCenter = (initialLat && initialLng)
    ? [initialLat, initialLng]
    : OMER_CENTER;

  const [position, setPosition] = useState({
    lat: initialLat || OMER_CENTER[0],
    lng: initialLng || OMER_CENTER[1],
  });

  const handleMapClick = useCallback(({ lat, lng }) => {
    setPosition({ lat, lng });
  }, []);

  const handleDragEnd = useCallback((e) => {
    const { lat, lng } = e.target.getLatLng();
    setPosition({ lat, lng });
  }, []);

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 20000,
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Top bar — 2-row mobile-first layout */}
      <div style={{
        background: "linear-gradient(135deg, #1a237e 0%, #283593 100%)",
        color: "white",
        padding: "10px 14px",
        zIndex: 1,
        flexShrink: 0,
        direction: "rtl",
        boxShadow: "0 2px 12px rgba(0,0,0,0.35)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}>
        {/* Row 1 — Title */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.2 }}>📍 בחר מיקום חדש</div>
        </div>

        {/* Row 2 — Coordinates + Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Live coordinates badge (restored to old styling) */}
          <div style={{
            background: "rgba(255,255,255,0.15)",
            borderRadius: 8,
            padding: "6px 12px",
            fontSize: 13,
            fontFamily: "monospace",
            direction: "ltr",
            whiteSpace: "nowrap",
          }}>
            {position.lng.toFixed(5)}, {position.lat.toFixed(5)}
          </div>

          {/* Cancel */}
          <button
            onClick={onCancel}
            style={{
              flexShrink: 0,
              background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.35)",
              color: "white",
              borderRadius: 8,
              padding: "7px 12px",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 500,
              whiteSpace: "nowrap",
            }}
          >
            ביטול
          </button>

          {/* Confirm */}
          <button
            onClick={() => onConfirm(position)}
            style={{
              flexShrink: 0,
              background: "linear-gradient(135deg, #43a047 0%, #2e7d32 100%)",
              border: "none",
              color: "white",
              borderRadius: 8,
              padding: "7px 14px",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 700,
              boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
              whiteSpace: "nowrap",
            }}
          >
            ✅ אשר
          </button>
        </div>
      </div>

      {/* Map */}
      <div style={{ flex: 1, position: "relative" }}>
        <MapContainer
          center={defaultCenter}
          zoom={15}
          style={{ height: "100%", width: "100%" }}
          zoomControl={true}
        >
          <TileLayer
            attribution="© OpenStreetMap"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onMapClick={handleMapClick} />
          <Marker
            position={[position.lat, position.lng]}
            icon={pickerIcon}
            draggable={true}
            eventHandlers={{ dragend: handleDragEnd }}
          />
        </MapContainer>
      </div>
    </div>
  );
}
