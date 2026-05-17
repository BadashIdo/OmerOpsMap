/**
 * App-wide constants shared across components and hooks.
 * Centralizes magic values so they only need to change in one place.
 */

/** Geographic center of the city of Omer — used as the default map center on load. */
export const OMER_CENTER = [31.2632, 34.8419];

/** Mirror of `data_server/app/services/integrations/geofence.py:OMER_RADIUS_KM`. */
export const OMER_RADIUS_KM = 5.0;

/**
 * Official district names for the city of Omer.
 * These must match exactly the district values stored in the database,
 * because they are used for both filtering and proximity-based district assignment.
 */
export const DISTRICTS = ["רובע א'", "רובע ב'", "רובע ג'", "רובע ד'", "פארק תעשיות"];

/**
 * External data source registry — one row per backend integration.
 * Each entry drives the LayersControl UI: id matches the source name on the
 * server (`external_features.source`), label_he is the toggle text shown to
 * users, color and icon are used by leafletIcons.js to render markers.
 */
export const EXTERNAL_LAYERS = [
  {
    id: "oref_alert",
    label_he: "פיקוד העורף",
    color: "#dc3545",
    icon: "warning",
    defaultVisible: true,
    cadenceSeconds: 30,
  },
  {
    id: "tomtom_traffic",
    label_he: "תנועה בכבישים ראשיים",
    color: "#ff6b35",
    icon: "traffic",
    defaultVisible: true,
    cadenceSeconds: 90,
  },
  {
    id: "openmeteo_weather",
    label_he: "מזג אוויר",
    color: "#0099cc",
    icon: "cloud",
    defaultVisible: false,
    cadenceSeconds: 15 * 60,
  },
];

/**
 * Static map overlays — bundled with the app, no backend sync.
 * Rendered in LayersControl as a separate section (no "last synced" line).
 */
export const STATIC_LAYERS = [
  {
    id: "omer_quarters",
    label_he: "רבעי עומר",
    color: "#7fbce0",
    icon: "grid_view",
    defaultVisible: false,
    subline: "חלוקה לרבעים א'–ד' (כולל פארק ההייטק)",
  },
];
