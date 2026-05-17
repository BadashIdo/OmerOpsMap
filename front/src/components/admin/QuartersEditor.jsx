/**
 * QuartersEditor — admin-only Leaflet-Geoman editor for the Omer quarters polygons.
 *
 * Renders inside <MapContainer>. While mounted it:
 *   1. Adds each quarter polygon to the map as a real (editable) L.Polygon.
 *   2. Enables Geoman global edit/drag/cut/remove modes via L.PM.
 *   3. Renders a floating toolbar (via portal) with Export JSON + Reset + Exit buttons.
 *
 * Export produces a GeoJSON FeatureCollection identical in shape to
 * src/data/omer_quarters.json so the result can be pasted straight back in.
 */

import { useEffect, useRef, useState } from "react";
import { useMap } from "react-leaflet";
import { createPortal } from "react-dom";
import L from "leaflet";
import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
import "../../styles/QuartersEditor.css";

function buildLayersFromGeoJSON(geojson, onEdit) {
  return geojson.features.map((feature) => {
    // GeoJSON is [lng, lat]; Leaflet wants [lat, lng]
    const latlngs = feature.geometry.coordinates[0].map(([lng, lat]) => [lat, lng]);
    const polygon = L.polygon(latlngs, {
      color: feature.properties.color,
      weight: 2,
      opacity: 0.9,
      fillColor: feature.properties.color,
      fillOpacity: 0.25,
      dashArray: "6,4",
    });
    polygon.feature = { type: "Feature", properties: { ...feature.properties }, geometry: feature.geometry };
    polygon.bindTooltip(feature.properties.name, {
      permanent: false,
      direction: "center",
      className: "quarter-tooltip",
    });
    polygon.on("pm:edit pm:dragend pm:vertexadded pm:vertexremoved pm:cut", onEdit);
    return polygon;
  });
}

function layersToGeoJSON(layers) {
  return {
    type: "FeatureCollection",
    name: "omer_quarters",
    features: layers.map((layer) => {
      const latlngs = layer.getLatLngs()[0];
      // Close the ring (GeoJSON spec requires first == last)
      const ring = latlngs.map((p) => [round6(p.lng), round6(p.lat)]);
      if (ring.length > 0) ring.push([ring[0][0], ring[0][1]]);
      return {
        type: "Feature",
        properties: layer.feature.properties,
        geometry: { type: "Polygon", coordinates: [ring] },
      };
    }),
  };
}

function round6(n) {
  return Math.round(n * 1e6) / 1e6;
}

export default function QuartersEditor({ initialGeoJSON, onExit }) {
  const map = useMap();
  const layersRef = useRef([]);
  const [dirty, setDirty] = useState(false);
  const [exportText, setExportText] = useState(null);

  useEffect(() => {
    const handleEdit = () => setDirty(true);

    const layers = buildLayersFromGeoJSON(initialGeoJSON, handleEdit);
    layersRef.current = layers;
    layers.forEach((l) => l.addTo(map));

    // Enable Geoman editing on every layer
    layers.forEach((l) => l.pm.enable({ snappable: true, snapDistance: 15, allowSelfIntersection: false }));

    // Add the Geoman toolbar to the map (top-left), only the modes that make sense for editing existing polygons
    map.pm.addControls({
      position: "topleft",
      drawMarker: false,
      drawCircleMarker: false,
      drawCircle: false,
      drawRectangle: false,
      drawPolyline: false,
      drawPolygon: false,
      drawText: false,
      editMode: true,
      dragMode: true,
      cutPolygon: true,
      removalMode: false,
      rotateMode: false,
    });
    map.pm.setLang("he");

    return () => {
      layers.forEach((l) => {
        try { l.pm.disable(); } catch { /* noop */ }
        map.removeLayer(l);
      });
      try { map.pm.removeControls(); } catch { /* noop */ }
    };
  }, [map, initialGeoJSON]);

  const handleExport = () => {
    const json = layersToGeoJSON(layersRef.current);
    const text = JSON.stringify(json, null, 2);
    setExportText(text);
    navigator.clipboard?.writeText(text).catch(() => {});
  };

  const handleDownload = () => {
    const json = layersToGeoJSON(layersRef.current);
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "omer_quarters.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Render the toolbar outside the map via a portal to body
  const toolbar = createPortal(
    <div className="quarters-editor-toolbar" dir="rtl">
      <div className="quarters-editor-title">
        <span className="material-symbols-outlined">edit_location_alt</span>
        עריכת רבעי עומר {dirty && <span className="quarters-editor-dirty">●</span>}
      </div>
      <div className="quarters-editor-actions">
        <button type="button" onClick={handleExport}>
          <span className="material-symbols-outlined">content_copy</span>
          העתק JSON
        </button>
        <button type="button" onClick={handleDownload}>
          <span className="material-symbols-outlined">download</span>
          הורד קובץ
        </button>
        <button type="button" className="quarters-editor-exit" onClick={onExit}>
          <span className="material-symbols-outlined">close</span>
          סיים
        </button>
      </div>
      {exportText && (
        <div className="quarters-editor-export">
          <div className="quarters-editor-export-hint">הועתק ללוח. שלח לי את התוכן כדי לקבע אותו ב-built-in:</div>
          <textarea readOnly value={exportText} onFocus={(e) => e.target.select()} />
        </div>
      )}
    </div>,
    document.body
  );

  return toolbar;
}
