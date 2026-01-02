import L from "leaflet";

export const userIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// מיפוי תת-קטגוריות לאייקונים וצבעים (Material Design Icons)
const categoryIconMap = {
  "ריכוזי אשפה": { icon: "delete", color: "#6c757d" },           // אפור - פח אשפה
  "כלי מחזור": { icon: "recycling", color: "#28a745" },          // ירוק - מחזור
  "עמדות גזם": { icon: "yard", color: "#20c997" },               // ירוק בהיר - גינה
  "חסימות גבישים": { icon: "construction", color: "#fd7e14" },  // כתום - בניה
  "מקליטים ציבוריים": { icon: "shield", color: "#6f42c1" },     // סגול - מגן
  "התראות חירום": { icon: "emergency", color: "#dc3545" },      // אדום - חירום
  "אירועים קרובים": { icon: "event", color: "#ffc107" },        // צהוב - אירוע
  "מוסדות חינוך": { icon: "school", color: "#007bff" },          // כחול - בית ספר
  "מתקני ספורט": { icon: "sports_soccer", color: "#e83e8c" },   // ורוד - כדורגל
  "פנאי": { icon: "park", color: "#17a2b8" },                    // טורקיז - פארק
};

// ברירת מחדל אם תת-קטגוריה לא נמצאה
const defaultIcon = { icon: "location_on", color: "#6c757d" };

/**
 * מחזירה אייקון מותאם אישית לפי תת-קטגוריה
 * @param {string} subCategory - שם תת-הקטגוריה
 * @returns {L.DivIcon} - אייקון Leaflet מותאם אישית
 */
export function getCategoryIcon(subCategory) {
  const config = categoryIconMap[subCategory] || defaultIcon;
  
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