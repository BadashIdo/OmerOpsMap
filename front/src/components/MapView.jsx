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

import { MapContainer, TileLayer, Marker, Popup, Polyline, GeoJSON, useMapEvents } from "react-leaflet";
import omerQuartersGeoJSON from "../data/omer_quarters.json";
import QuartersEditor from "./admin/QuartersEditor";
import React, { useRef, useCallback, useMemo, useEffect } from "react";
import MarkerClusterGroup from "react-leaflet-cluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import L from "leaflet";
import { userIcon, getCategoryIcon, getExternalIcon } from "../lib/leafletIcons";
import { OMER_CENTER, EXTERNAL_LAYERS } from "../lib/constants";

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

// Component to handle map long press events (works on desktop and mobile)
function MapLongPressHandler({ onLongPress, mapRef }) {
  const pressTimerRef = useRef(null);
  const pressLocationRef = useRef(null);
  const LONG_PRESS_DURATION = 600; // ms

  const handlePressStart = useCallback((e) => {
    if (!mapRef.current) return;

    // Handle both Leaflet events (e.latlng) and touch events (e.touches)
    let latlng;
    if (e.latlng) {
      latlng = e.latlng;
    } else if (e.touches && e.touches[0]) {
      const touch = e.touches[0];
      const rect = mapRef.current.getContainer().getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      latlng = mapRef.current.containerPointToLatLng(L.point(x, y));
    }

    if (latlng) {
      pressLocationRef.current = latlng;
      pressTimerRef.current = setTimeout(() => {
        if (onLongPress && pressLocationRef.current) {
          onLongPress({
            lat: pressLocationRef.current.lat,
            lng: pressLocationRef.current.lng,
          });
        }
      }, LONG_PRESS_DURATION);
    }
  }, [onLongPress, mapRef]);

  const handlePressEnd = useCallback(() => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  }, []);

  useMapEvents({
    mousedown: handlePressStart,
    mouseup: handlePressEnd,
    dragstart: handlePressEnd,
  });

  // Also add direct DOM touch listeners for mobile
  useEffect(() => {
    if (!mapRef.current) return;

    const container = mapRef.current.getContainer();

    const handleTouchStart = (e) => {
      // Only single-finger taps trigger long-press; multi-touch is a pinch-zoom gesture.
      if (e.touches && e.touches.length === 1) {
        handlePressStart(e);
      } else {
        handlePressEnd();
      }
    };

    const handleTouchMove = (e) => {
      // A second finger landing mid-press → user is pinching, cancel the pending long-press.
      if (e.touches && e.touches.length > 1) {
        handlePressEnd();
      }
    };

    const handleTouchEnd = () => {
      handlePressEnd();
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [mapRef, handlePressStart, handlePressEnd]);

  return null;
}

export default function MapView({
  mapRef,
  markerRefs,
  clusterRef,
  userLocation,
  points,
  temporarySites = [],
  externalFeaturesBySource = {},
  visibleLayers = {},
  onMarkerClick,
  onLongPress,
  isAdmin,
  onEditSite,
  quartersEditing = false,
  onExitQuartersEditing,
}) {
  // Stable ref callback — not recreated on every render, prevents unnecessary updates while dragging
  const setMarkerRef = useCallback((el, key) => {
    markerRefs.current[key] = el;
  }, [markerRefs]);

  return (
    <MapContainer center={OMER_CENTER} zoom={15} maxZoom={22} zoomControl={false} style={{ height: "100%", width: "100%" }} ref={mapRef}>
      <TileLayer 
        attribution="© OpenStreetMap" 
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
        maxZoom={22} 
        maxNativeZoom={19} 
      />

      {/* Long press handler for adding new requests */}
      {onLongPress && <MapLongPressHandler onLongPress={onLongPress} mapRef={mapRef} />}

      {/* Static overlay — Omer quarters polygons (read-only). Hidden while admin is editing. */}
      {visibleLayers?.omer_quarters && !quartersEditing && (
        <GeoJSON
          key="omer_quarters"
          data={omerQuartersGeoJSON}
          style={(feature) => ({
            color: feature.properties.color,
            weight: 2,
            opacity: 0.9,
            fillColor: feature.properties.color,
            fillOpacity: 0.25,
            dashArray: "6,4",
          })}
          onEachFeature={(feature, layer) => {
            layer.bindTooltip(feature.properties.name, {
              permanent: false,
              direction: "center",
              className: "quarter-tooltip",
            });
          }}
        />
      )}

      {/* Admin-only editable version with Geoman */}
      {isAdmin && quartersEditing && (
        <QuartersEditor
          initialGeoJSON={omerQuartersGeoJSON}
          onExit={onExitQuartersEditing}
        />
      )}

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

      {/* All Sites — clustered together, memoized separately so markers only re-render when their respective data changes */}
      <MarkerClusterGroup ref={clusterRef} chunkedLoading maxClusterRadius={50} spiderfyOnMaxZoom={true} showCoverageOnHover={false} iconCreateFunction={createClusterIcon}>
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
              <SitePopup site={p} isAdmin={isAdmin} onEdit={(site) => onEditSite?.(site, "permanent")} />
            </Popup>
          </Marker>
        )), [points, onMarkerClick, setMarkerRef, isAdmin, onEditSite])}

        {useMemo(() => temporarySites.map((t) => (
          <Marker
            key={`temporary-${t.id}`}
            position={[t.lat, t.lng]}
            icon={getCategoryIcon(t.sub_category)}
            ref={(el) => setMarkerRef(el, `temporary-${t.id}`)}
            eventHandlers={{
              click: (e) => {
                L.DomEvent.stopPropagation(e);
                onMarkerClick(t);
              },
            }}
          >
            <Popup autoPan={false}>
              <TemporarySitePopup site={t} isAdmin={isAdmin} onEdit={(site) => onEditSite?.(site, "temporary")} />
            </Popup>
          </Marker>
        )), [temporarySites, setMarkerRef, isAdmin, onEditSite])}
      </MarkerClusterGroup>

      {/* External data layers.
          - Weather: rendered as a top-corner widget, not a map pin.
          - TomTom: rendered as Waze-style colored polylines along the road
            geometry, NOT clustered (lines don't cluster meaningfully).
          - Other sources: clustered point markers per source. */}
      {EXTERNAL_LAYERS
        .filter((layer) => visibleLayers[layer.id])
        .filter((layer) => layer.id !== "openmeteo_weather")
        .map((layer) => {
        const features = externalFeaturesBySource[layer.id] || [];
        if (features.length === 0) return null;

        if (layer.id === "tomtom_traffic") {
          return (
            <TomTomTrafficLayer
              key={`ext-${layer.id}`}
              features={features}
              labelHe={layer.label_he}
            />
          );
        }

        return (
          <MarkerClusterGroup
            key={`ext-${layer.id}`}
            chunkedLoading
            maxClusterRadius={60}
            spiderfyOnMaxZoom
            showCoverageOnHover={false}
            iconCreateFunction={(cluster) =>
              L.divIcon({
                html: `<div style="
                  width:38px;height:38px;background:${layer.color};border-radius:50%;
                  display:flex;align-items:center;justify-content:center;
                  color:#fff;font-weight:700;font-size:14px;
                  border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.35);
                ">${cluster.getChildCount()}</div>`,
                className: "",
                iconSize: L.point(38, 38),
              })
            }
          >
            {features.map((f) => (
              <Marker
                key={`ext-${layer.id}-${f.id}`}
                position={[f.lat, f.lng]}
                icon={getExternalIcon(f)}
                opacity={f.is_stale ? 0.5 : 1}
              >
                <Popup>
                  <div style={{ direction: "rtl", maxWidth: "260px" }}>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>
                      {f.name}
                    </div>
                    {f.description && (
                      <div style={{ fontSize: 12, color: "#444", marginBottom: 6 }}>
                        {f.description}
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: "#888", unicodeBidi: "plaintext" }}>
                      {layer.label_he}
                      {f.is_stale ? " · נתון מיושן" : ""}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
        );
      })}

    </MapContainer>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TomTomTrafficLayer — Waze-style traffic visualization for incidents.
//
// TomTom's `magnitudeOfDelay` (0-4) drives color and stroke weight:
//   0 Unknown    → amber, thin
//   1 Minor      → orange, normal
//   2 Moderate   → red-orange, normal
//   3 Major      → red, thick
//   4 Closure    → very deep red, thick + dashed (signals "blocked", not "slow")
//
// Each incident with LineString/MultiLineString geometry renders as:
//   - A soft halo polyline (wider, semi-transparent) — readability on busy maps
//   - A solid main polyline — the actual traffic indicator
//   - A small icon marker at the centroid — tap target + popup anchor
//
// The popup mirrors what Waze shows: cause, severity badge, length and delay
// in human-readable form, road number(s), and a freshness footer.
// ─────────────────────────────────────────────────────────────────────────────

const TOMTOM_SEVERITY = {
  0: { color: "#fbbf24", label: "לא ידוע", weight: 5 },
  1: { color: "#fb923c", label: "תנועה קלה", weight: 6 },
  2: { color: "#ef4444", label: "תנועה בינונית", weight: 7 },
  3: { color: "#b91c1c", label: "תנועה כבדה", weight: 8 },
  4: { color: "#7f1d1d", label: "כביש חסום", weight: 8, dashed: true },
};

function tomtomStyle(severity) {
  return TOMTOM_SEVERITY[severity] || TOMTOM_SEVERITY[1];
}

function formatDelaySeconds(seconds) {
  if (seconds == null || seconds <= 0) return null;
  if (seconds < 60) return `עיכוב ${seconds} שנ׳`;
  const minutes = Math.round(seconds / 60);
  return `עיכוב ~${minutes} דק׳`;
}

function formatLengthMeters(meters) {
  if (meters == null || meters <= 0) return null;
  if (meters < 1000) return `${Math.round(meters)} מ׳`;
  return `${(meters / 1000).toFixed(1)} ק"מ`;
}

function TomTomTrafficLayer({ features, labelHe }) {
  return (
    <>
      {features.map((f) => {
        const geom = f.geom_polyline;
        const sev = tomtomStyle(f.severity);
        const opacity = f.is_stale ? 0.4 : 1;
        const payload = f.payload || {};

        const positions = (() => {
          if (!geom || !geom.coordinates) return null;
          if (geom.type === "LineString") {
            return geom.coordinates.map(([lng, lat]) => [lat, lng]);
          }
          if (geom.type === "MultiLineString") {
            return geom.coordinates.map((line) =>
              line.map(([lng, lat]) => [lat, lng])
            );
          }
          return null;
        })();

        const delayText = formatDelaySeconds(payload.delay);
        const lengthText = formatLengthMeters(payload.length);
        const roads = (payload.roadNumbers || []).filter(Boolean).join(", ");

        const popup = (
          <Popup>
            <div style={{ direction: "rtl", maxWidth: "300px", fontFamily: "inherit" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 6, lineHeight: 1.3 }}>
                {f.name}
              </div>

              {/* Severity chip + road number */}
              <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", marginBottom: 8 }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "3px 8px",
                    borderRadius: 999,
                    background: sev.color,
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.2px",
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: 3, background: "#fff", opacity: 0.9 }} />
                  {sev.label}
                </span>
                {roads && (
                  <span style={{ fontSize: 11, color: "#475569", fontWeight: 600 }}>
                    כביש <bdi>{roads}</bdi>
                  </span>
                )}
              </div>

              {/* Stats row */}
              {(delayText || lengthText) && (
                <div style={{ display: "flex", gap: 12, marginBottom: 8, fontSize: 12, color: "#1f2937" }}>
                  {lengthText && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14, color: "#64748b" }}>
                        straighten
                      </span>
                      <bdi>{lengthText}</bdi>
                    </span>
                  )}
                  {delayText && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14, color: "#64748b" }}>
                        schedule
                      </span>
                      <bdi>{delayText}</bdi>
                    </span>
                  )}
                </div>
              )}

              {f.description && (
                <div style={{ fontSize: 12, color: "#475569", marginBottom: 8, lineHeight: 1.4 }}>
                  {f.description}
                </div>
              )}

              <div style={{ fontSize: 10, color: "#94a3b8", borderTop: "1px dashed #e2e8f0", paddingTop: 6, unicodeBidi: "plaintext" }}>
                {labelHe} · TomTom{f.is_stale ? " · נתון מיושן" : ""}
              </div>
            </div>
          </Popup>
        );

        return (
          <React.Fragment key={`tomtom-${f.id}`}>
            {positions && (
              <>
                {/* Halo — gives the line presence on busy basemaps */}
                <Polyline
                  positions={positions}
                  pathOptions={{
                    color: sev.color,
                    weight: sev.weight + 8,
                    opacity: 0.18 * opacity,
                    lineCap: "round",
                    lineJoin: "round",
                  }}
                  interactive={false}
                />
                {/* Main line */}
                <Polyline
                  positions={positions}
                  pathOptions={{
                    color: sev.color,
                    weight: sev.weight,
                    opacity: 0.95 * opacity,
                    lineCap: "round",
                    lineJoin: "round",
                    dashArray: sev.dashed ? "10 10" : undefined,
                    className: sev.dashed ? "tomtom-line-closed" : undefined,
                  }}
                >
                  {popup}
                </Polyline>
              </>
            )}
            {/* Tap target + popup anchor at the centroid */}
            <Marker
              position={[f.lat, f.lng]}
              icon={getExternalIcon(f)}
              opacity={opacity}
            >
              {popup}
            </Marker>
          </React.Fragment>
        );
      })}
    </>
  );
}