import L from "leaflet";

// אייקון מיקום משתמש מותאם אישית עם נקודה כחולה
export const userIcon = new L.DivIcon({
  html: `
    <div style="
      position: relative;
      width: 30px;
      height: 30px;
    ">
      <!-- מעגל חיצוני מהבהב -->
      <div style="
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 30px;
        height: 30px;
        background: rgba(66, 133, 244, 0.3);
        border-radius: 50%;
        animation: userPulse 2s ease-out infinite;
      "></div>
      
      <!-- נקודה כחולה מרכזית -->
      <div style="
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 16px;
        height: 16px;
        background: #4285f4;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      "></div>
    </div>
    
    <style>
      @keyframes userPulse {
        0% {
          transform: translate(-50%, -50%) scale(0.8);
          opacity: 1;
        }
        100% {
          transform: translate(-50%, -50%) scale(2);
          opacity: 0;
        }
      }
    </style>
  `,
  className: 'user-location-marker',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15],
});

// מיפוי קטגוריות ותת‑קטגוריות לצבעים ואייקונים.
// חשוב לשים לב ששמות המפתחות כאן חייבים להתאים בדיוק לשמות הקטגוריה/תת‑קטגוריה שמגיעים מהשרת
// אחרת ישתמש ברירת מחדל (אפור).
const categoryIconMap = {
  // ----- קטגוריות ראשיות -----
  /** חינוך, קהילה ופנאי */
  "חינוך, קהילה ופנאי": { icon: "school", color: "#007bff" },
  /** המרחב הציבורי ואיכות הסביבה */
  "המרחב הציבורי ואיכות הסביבה": { icon: "park", color: "#28a745" },
  /** ביטחון, תחבורה ותשתיות */
  "ביטחון, תחבורה ותשתיות": { icon: "construction", color: "#fd7e14" },
  /** המועצה ושירותי תפעול */
  "המועצה ושירותי תפעול": { icon: "account_balance", color: "#6f42c1" },
  /** בריאות, מסחר ושירותים */
  "בריאות, מסחר ושירותים": { icon: "medical_services", color: "#e83e8c" },

  // ----- תתי‑קטגוריות שכיחות -----
  // חינוך וקהילה
  "בתי ספר": { icon: "school", color: "#007bff" },
  "גני ילדים ופעוטונים": { icon: "child_care", color: "#20c997" },
  "שירותי דת": { icon: "church", color: "#6f42c1" },
  "בית כנסת": { icon: "church", color: "#6f42c1" },
  "מוסדות קהילה": { icon: "groups", color: "#17a2b8" },
  "מתקני ספורט": { icon: "sports_soccer", color: "#e83e8c" },
  "תנועות נוער ומועדונים": { icon: "diversity_3", color: "#fd7e14" },
  "מרכזי נוער": { icon: "diversity_3", color: "#ffc107" },
  "מרכז גמלאים": { icon: "elderly", color: "#20c997" },
  // סביבה ופנאי
  "גינות כלבים": { icon: "pets", color: "#20c997" },
  "גינות משחקים": { icon: "park", color: "#28a745" },
  "גנים ופארקים": { icon: "park", color: "#17a2b8" },
  // ביטחון ושירותי חירום
  "חירום וביטחון": { icon: "emergency", color: "#dc3545" },
  // סביבה ותשתיות
  "מרכזי מחזור": { icon: "recycling", color: "#28a745" },
  "תפעול שוטף": { icon: "build", color: "#6c757d" },
  "תחבורה ציבורית": { icon: "directions_bus", color: "#007bff" },
  "חניונים וחניה": { icon: "local_parking", color: "#6f42c1" },
  "תשתיות דרך": { icon: "construction", color: "#fd7e14" },
  // טבע ומורשת
  "טבע ומורשת": { icon: "landscape", color: "#198754" },
  // מועצה ושירותים
  "משרדי מועצה": { icon: "account_balance", color: "#6610f2" },
  "מוקדי שירות": { icon: "room_service", color: "#0dcaf0" },
  "שירותים לתושב": { icon: "support_agent", color: "#ffc107" },
  "שירותי בריאות": { icon: "medical_services", color: "#dc3545" },
  "מסחר והסעדה": { icon: "restaurant", color: "#e83e8c" },

  // ----- קטגוריות ותתי‑קטגוריות מהגרסה הישנה -----
  "ריכוזי אשפה": { icon: "delete", color: "#6c757d" },
  "כלי מחזור": { icon: "recycling", color: "#28a745" },
  "עמדות גזם": { icon: "yard", color: "#20c997" },
  "חסימות גבישים": { icon: "construction", color: "#fd7e14" },
  "מקליטים ציבוריים": { icon: "shield", color: "#6f42c1" },
  "התראות חירום": { icon: "emergency", color: "#dc3545" },
  "אירועים קרובים": { icon: "event", color: "#ffc107" },
  "מוסדות חינוך": { icon: "school", color: "#007bff" },
  "פנאי": { icon: "park", color: "#17a2b8" },
};

// ברירת מחדל אם תת-קטגוריה לא נמצאה
const defaultIcon = { icon: "location_on", color: "#6c757d" };

/**
 * מחזירה אייקון מותאם אישית לפי תת-קטגוריה
 * @param {string} subCategory - שם תת-הקטגוריה
 * @returns {L.DivIcon} - אייקון Leaflet מותאם אישית
 */
export function getCategoryIcon(name) {
  // ננקה רווחים מיותרים – שמות מהשרת לפעמים מגיעים עם רווח בסוף
  const key = (name || '').trim();
  const config = categoryIconMap[key] || defaultIcon;

  const html = `
    <div style="
      position: relative;
      width: 25px;
      height: 41px;
    ">
      <div style="
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 12.5px solid transparent;
        border-right: 12.5px solid transparent;
        border-top: 20px solid ${config.color};
      "></div>
      <div style="
        position: absolute;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 25px;
        height: 25px;
        background-color: ${config.color};
        border-radius: 50% 50% 50% 0;
        transform: translateX(-50%) rotate(-45deg);
        border: 2px solid white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      "></div>
      <span class="material-symbols-outlined" style="
        position: absolute;
        top: 4px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 16px;
        color: white;
        z-index: 10;
        text-shadow: 0 1px 2px rgba(0,0,0,0.3);
      ">${config.icon}</span>
    </div>
  `;

  return new L.DivIcon({
    html: html,
    className: 'custom-marker-icon',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });
}

/**
 * מחזיר את תצורת האייקון (אייקון וצבע) עבור קטגוריה או תת‑קטגוריה נתונה.
 * ניתן להשתמש בפונקציה זו במקומות שאינם Leaflet (לדוגמה, Sidebar) כדי לקבל את הצבע המתאים.
 * @param {string} name - שם הקטגוריה או תת‑הקטגוריה
 * @returns {{icon: string, color: string}} - אובייקט עם מפתח icon ומפתח color
 */
export function getCategoryConfig(name) {
  const key = (name || '').trim();
  return categoryIconMap[key] || defaultIcon;
}


/**
 * Per-source external feature icons. Pulses the oref alert.
 * @param {Object} feature - { source, kind, severity, is_stale }
 */
export function getExternalIcon(feature) {
  const { source, kind, is_stale } = feature || {};

  const config = externalIconConfig(source, kind);
  const opacity = is_stale ? 0.4 : 1;
  const pulse = source === "oref_alert" && !is_stale;

  const html = `
    <div style="
      position: relative;
      width: 36px;
      height: 36px;
      opacity: ${opacity};
    ">
      ${pulse ? `
        <div style="
          position: absolute;
          inset: 0;
          background: ${config.color};
          border-radius: 50%;
          opacity: 0.35;
          animation: extPulse 1.4s ease-out infinite;
        "></div>
      ` : ""}
      <div style="
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 28px;
        height: 28px;
        background: ${config.color};
        border: 3px solid #fff;
        border-radius: 50%;
        box-shadow: 0 2px 6px rgba(0,0,0,0.35);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <span class="material-symbols-outlined" style="
          font-size: 16px;
          color: #fff;
          line-height: 1;
        ">${config.icon}</span>
      </div>
    </div>
    <style>
      @keyframes extPulse {
        0%   { transform: scale(0.7); opacity: 0.7; }
        100% { transform: scale(2.2); opacity: 0;   }
      }
    </style>
  `;

  return new L.DivIcon({
    html,
    className: `external-marker external-marker--${source || "unknown"}`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
}

/** Source+kind → { icon, color } for external markers. Pure lookup. */
export function externalIconConfig(source, kind) {
  if (source === "oref_alert") {
    return { icon: "warning", color: "#dc3545" };
  }
  if (source === "openmeteo_weather") {
    return { icon: "cloud", color: "#0099cc" };
  }
  if (source === "tomtom_traffic") {
    if (kind === "accident") return { icon: "car_crash", color: "#dc3545" };
    if (kind === "road_closed") return { icon: "block", color: "#b30000" };
    if (kind === "lane_closed") return { icon: "merge", color: "#ff6b35" };
    if (kind === "road_works") return { icon: "construction", color: "#ffc107" };
    if (kind === "jam") return { icon: "traffic_jam", color: "#fd7e14" };
    if (kind === "broken_down_vehicle") return { icon: "car_repair", color: "#6c757d" };
    return { icon: "traffic", color: "#ff6b35" };
  }
  return { icon: "info", color: "#6c757d" };
}