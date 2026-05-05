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
        position: relative;
        width: 22px;
        height: 37px;
      ">
        <div style="
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 11px solid transparent;
          border-right: 11px solid transparent;
          border-top: 17px solid ${color};
        "></div>
        <div style="
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 22px;
          height: 22px;
          background-color: ${color};
          border-radius: 50% 50% 50% 0;
          transform: translateX(-50%) rotate(-45deg);
          border: 2px solid white;
          box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        "></div>
        <span style="
          position: absolute;
          top: 3px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 13px;
          color: white;
          z-index: 10;
        ">⚡</span>
      </div>
    `,
    iconSize: [22, 37],
    iconAnchor: [11, 37],
    popupAnchor: [1, -31],
  });
}

export function getTemporaryIcon() {
  return createTemporaryIcon();
}

export function getCategoryEmoji() {
  return "📍";
}

