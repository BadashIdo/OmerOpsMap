import { useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./App.css";
// import "./leafletFix"; // וודא שזה מיובא ב-main.jsx או כאן במידה והמרקרים נעלמים
import { POINTS_WITH_COORDS } from "./data/POINTS";

const OMER_CENTER = [31.2632, 34.8419];

// אייקון כחול למיקום המשתמש
const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function normalize(s) {
  return (s || "").toString().trim().toLowerCase();
}

export default function App() {
  const mapRef = useRef(null);
  const markerRefs = useRef({});

  // States קיימים
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  // States לסרגל צד וסינון
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // --- State חדש לצ'אטבוט ---
  const [isChatOpen, setIsChatOpen] = useState(false);

  // מחלץ את כל תתי-הקטגוריות הייחודיות מהנתונים
  const allSubCategories = useMemo(() =>
    [...new Set(POINTS_WITH_COORDS.map(p => p.subCategory))].filter(Boolean),
  []);

  // ניהול הפילטרים שנבחרו (בהתחלה כולם דולקים)
  const [activeFilters, setActiveFilters] = useState(allSubCategories);

  // בניית מבנה הקטגוריות לתצוגה בתפריט (קטגוריה -> רשימת תתי קטגוריות)
  const categoriesStructure = useMemo(() => {
    const struct = {};

    POINTS_WITH_COORDS.forEach(p => {
      const mainCat = p.category || "ללא קטגוריה";
      const subCat = p.subCategory;

      if (!struct[mainCat]) {
        struct[mainCat] = new Set();
      }
      if (subCat) {
        struct[mainCat].add(subCat);
      }
    });

    return Object.fromEntries(
      Object.entries(struct).map(([key, value]) => [key, Array.from(value)])
    );
  }, []);

  // סינון הנקודות שיוצגו על המפה לפי הבחירה בתפריט
  const filteredPoints = useMemo(() => {
    return POINTS_WITH_COORDS.filter(p => activeFilters.includes(p.subCategory));
  }, [activeFilters]);

  // תוצאות חיפוש (מבוססות על הנקודות המסוננות בלבד)
  const results = useMemo(() => {
    const q = normalize(query);
    if (!q) return [];

    const scored = filteredPoints
      .map((p) => {
        const name = normalize(p.name);
        const address = normalize(p.address);
        const desc = normalize(p.description);

        let score = 0;
        if (name.startsWith(q)) score += 3;
        if (name.includes(q)) score += 2;
        if (address.includes(q)) score += 1;
        if (desc.includes(q)) score += 1;

        return { p, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score);

    return scored.slice(0, 8).map((x) => x.p);
  }, [query, filteredPoints]);

  const handleLocate = () => {
    const map = mapRef.current;
    if (!map) return;
    map.locate({ setView: true, maxZoom: 16 });
    map.on("locationfound", (e) => setUserLocation(e.latlng));
  };

  const goToPoint = (p) => {
    setSelectedId(p.id);
    setQuery(p.name);
    setShowResults(false);

    const map = mapRef.current;
    if (map) {
      map.flyTo([p.lat, p.lng], 17, {
        animate: true,
        duration: 1.5,
        noMoveStart: true
      });

      setTimeout(() => {
        const marker = markerRefs.current[p.id];
        if (marker) marker.openPopup();
      }, 1200);
    }
  };

  const toggleFilter = (subCat) => {
    setActiveFilters(prev =>
      prev.includes(subCat) ? prev.filter(c => c !== subCat) : [...prev, subCat]
    );
  };

  return (
    <div style={{ height: "100vh", width: "100vw", position: "relative", overflow: "hidden" }}>

      {/* כפתור המבורגר */}
      <button className="hamburger-btn" onClick={() => setIsSidebarOpen(true)}>
        ☰
      </button>

      {/* שכבת כיסוי כהה כשהסרגל פתוח */}
      <div
        className={`sidebar-overlay ${isSidebarOpen ? 'visible' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* סרגל צד ימני */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h3>תפריט קטגוריות</h3>
          <button onClick={() => setIsSidebarOpen(false)}>✕</button>
        </div>

        <div className="sidebar-content">
          {Object.entries(categoriesStructure).map(([mainCategory, subCategories]) => (
            <div key={mainCategory} className="category-group">
              <div className="category-title" style={{ fontWeight: 'bold', color: '#2c3e50', marginBottom: '8px' }}>
                {mainCategory}
              </div>
              <div className="sub-list" style={{ paddingRight: '10px' }}>
                {subCategories.map(sub => (
                  <label key={sub} className="subcategory-item" style={{ display: 'flex', gap: '8px', marginBottom: '5px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={activeFilters.includes(sub)}
                      onChange={() => toggleFilter(sub)}
                    />
                    <span style={{ fontSize: '14px' }}>{sub}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Search bar */}
      <div className="top-search">
        <div className="search-box">
          <div className="search-input-row">
            <span style={{ opacity: 0.6 }}>🔎</span>
            <input
              className="search-input"
              placeholder="חפש נקודה בעומר..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
            />
            {query && (
              <button className="search-clear" onClick={() => { setQuery(""); setShowResults(false); }}>✕</button>
            )}
          </div>

          {showResults && results.length > 0 && (
            <div className="search-results">
              {results.map((p) => (
                <div key={p.id} className="search-item" onClick={() => goToPoint(p)}>
                  <div className="search-item-title">{p.name}</div>
                  <div className="search-item-sub">{p.address || "עומר"}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* כפתורי צד (GPS ובית) */}
      <div className="bottom-controls">
        <button className="map-btn" onClick={handleLocate} title="איפה אני?">🎯</button>
        <button
          className="map-btn"
          onClick={() => mapRef.current?.flyTo(OMER_CENTER, 15)}
          title="מרכז עומר"
        >
          🏠
        </button>
      </div>

      {/* --- בועת צ'אט (Chatbot Bubble) --- */}
      <div className="chat-bubble" onClick={() => setIsChatOpen(!isChatOpen)}>
        {isChatOpen ? "✕" : "💬"}
      </div>

      {/* --- חלון צ'אט (Chat Window) --- */}
      <div className={`chat-window ${isChatOpen ? 'open' : ''}`}>
        <div className="chat-header">
          <span>עוזר אישי - עומר</span>
          <button onClick={() => setIsChatOpen(false)} style={{background:'none', border:'none', color:'white', cursor:'pointer'}}>✕</button>
        </div>
        <div className="chat-messages">
          <div style={{ background: '#e1f5fe', padding: '10px', borderRadius: '10px', marginBottom: '10px', textAlign: 'right' }}>
            שלום! אני הבוט של עומר. איך אפשר לעזור לך היום?
          </div>
          <p style={{ color: '#999', textAlign: 'center', marginTop: '20px', fontSize: '12px' }}>
            (ממשק הצ'אט יופעל בקרוב...)
          </p>
        </div>
        <div className="chat-input-area" style={{ display: 'flex', padding: '10px', borderTop: '1px solid #eee' }}>
          <input type="text" placeholder="הקלד הודעה..." disabled style={{ flex: 1, borderRadius: '20px', padding: '5px 10px', border: '1px solid #ddd' }} />
          <button style={{ border: 'none', background: 'none', fontSize: '18px', marginRight: '5px' }}>➡️</button>
        </div>
      </div>

      <MapContainer
        center={OMER_CENTER}
        zoom={15}
        style={{ height: "100%", width: "100%" }}
        ref={mapRef}
      >
        <TileLayer
          attribution='© OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {userLocation && (
          <Marker position={userLocation} icon={userIcon}>
            <Popup>אתה כאן</Popup>
          </Marker>
        )}

        {filteredPoints.map((p) => (
          <Marker
            key={p.id}
            position={[p.lat, p.lng]}
            ref={(el) => (markerRefs.current[p.id] = el)}
            eventHandlers={{
              click: (e) => {
                L.DomEvent.stopPropagation(e);
                goToPoint(p);
              },
            }}
          >
            <Popup>
              <div style={{ direction: 'rtl', textAlign: 'right', minWidth: '160px' }}>
                <b style={{ fontSize: '15px' }}>{p.name}</b>
                <div style={{ fontSize: '13px', margin: '5px 0' }}>{p.description}</div>

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    backgroundColor: '#4285F4',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '5px',
                    textDecoration: 'none',
                    fontSize: '13px',
                    fontWeight: '500',
                    marginTop: '8px'
                  }}
                >
                  🚗 ניווט עם Google Maps
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}