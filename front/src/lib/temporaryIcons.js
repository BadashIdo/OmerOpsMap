import L from "leaflet";

/**
 * Create custom icons for temporary events based on priority
 */

// Create colored divIcon for temporary events
function createTemporaryIcon() {
  const color = "#FF9800"; // Default Orange for all temp events

  return L.divIcon({
    className: "custom-temp-icon",
    html: `
      <div style="
        background-color: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50% 50% 50% 0;
        border: 3px solid white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <span style="
          transform: rotate(45deg);
          font-size: 16px;
          color: white;
        ">⚠️</span>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  });
}

export function getTemporaryIcon() {
  return createTemporaryIcon();
}

export function getCategoryEmoji() {
  return "📍";
}

