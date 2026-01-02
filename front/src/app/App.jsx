import { useMemo, useRef, useState, useEffect } from "react";
import "../styles/App.css";
import appStyles from "../styles/App.module.css";
import controlsStyles from "../styles/MapControls.module.css";
import { useSites } from "../hooks/useSites";
import { normalize } from "../lib/text";

import SideBar from "../components/SideBar";
import SearchBar from "../components/SearchBar";
import Chat from "../components/Chat";
import MapView from "../components/MapView";


const OMER_CENTER = [31.2632, 34.8419];
const DISTRICTS = ["רובע א'", "רובע ב'", "רובע ג'", "רובע ד'"];

export default function App() {
  const { points, loadError } = useSites(); // <-- נקודות מהאקסל

  const mapRef = useRef(null);
  const markerRefs = useRef({});
  const watchIdRef = useRef(null);

  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // כל תתי-הקטגוריות (מתוך points!)
  const allSubCategories = useMemo(
    () => [...new Set(points.map((p) => p.subCategory))].filter(Boolean),
    [points]
  );

  // פילטרים דיפולטיים: בהתחלה "הכול דלוק"
  const [activeFilters, setActiveFilters] = useState([]);

  // ברגע שהדאטה נטען בפעם הראשונה, נדליק את כולם (רק אם עדיין ריק)
  useMemo(() => {
    if (activeFilters.length === 0 && allSubCategories.length > 0) {
      // מוסיפים גם את תתי-הקטגוריות וגם את הרובעים
      setActiveFilters([...allSubCategories, ...DISTRICTS]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allSubCategories]);

  const categoriesStructure = useMemo(() => {
    const struct = {};
    points.forEach((p) => {
      const mainCat = p.category || "ללא קטגוריה";
      const subCat = p.subCategory;

      if (!struct[mainCat]) struct[mainCat] = new Set();
      if (subCat) struct[mainCat].add(subCat);
    });

    // הוספת קטגוריית רובעים ידנית
    struct["רובעים"] = DISTRICTS;

    return Object.fromEntries(
      Object.entries(struct).map(([k, v]) => [k, Array.isArray(v) ? v : Array.from(v)])
    );
  }, [points]);

  const filteredPoints = useMemo(() => {
    if (activeFilters.length === 0) return points;

    // הפרדה בין רובעים לתתי-קטגוריות
    const activeDistricts = activeFilters.filter((f) => DISTRICTS.includes(f));
    const activeSubCategories = activeFilters.filter((f) => !DISTRICTS.includes(f));

    return points.filter((p) => {
      // בדיקת רובע (אם יש רובעים פעילים)
      const districtMatch = activeDistricts.length === 0 || activeDistricts.includes(p.district);
      
      // בדיקת תת-קטגוריה (אם יש תת-קטגוריות פעילות)
      const subCategoryMatch = activeSubCategories.length === 0 || activeSubCategories.includes(p.subCategory);
      
      // האתר צריך לעמוד בשני התנאים (AND לוגי)
      return districtMatch && subCategoryMatch;
    });
  }, [points, activeFilters]);

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

  const toggleFilter = (subCat) => {
    setActiveFilters((prev) =>
      prev.includes(subCat)
        ? prev.filter((c) => c !== subCat)
        : [...prev, subCat]
    );
  };

  const goToPoint = (p) => {
    setSelectedId(p.id);
    setQuery(p.name);
    setShowResults(false);

    const map = mapRef.current;
    if (map) {
      map.flyTo([p.lat, p.lng], 17, { animate: true, duration: 1.5, noMoveStart: true });

      setTimeout(() => {
        const marker = markerRefs.current[p.id];
        if (marker) marker.openPopup();
      }, 1200);
    }
  };

  const handleLocate = () => {
    if (isTracking) {
      // עצירת המעקב
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setIsTracking(false);
      setUserLocation(null);
    } else {
      // התחלת מעקב
      if (!navigator.geolocation) {
        alert("הדפדפן שלך לא תומך במיקום גיאוגרפי");
        return;
      }

      const map = mapRef.current;
      
      // אפשרויות למעקב
      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      };

      // התחלת מעקב רציף
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newLocation = { lat: latitude, lng: longitude };
          
          setUserLocation(newLocation);
          
          // אם זה העדכון הראשון, נעבור למיקום
          if (!isTracking && map) {
            map.flyTo([latitude, longitude], 16, { animate: true, duration: 1 });
          }
          
          setIsTracking(true);
        },
        (error) => {
          console.error("שגיאה בקבלת מיקום:", error);
          alert("לא ניתן לקבל מיקום. אנא אפשר הרשאות מיקום בדפדפן.");
          setIsTracking(false);
        },
        options
      );
    }
  };

  // ניקוי המעקב כשהקומפוננטה נסגרת
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

return (
  <div className={appStyles.shell}>
    <div className={appStyles.mapLayer}>
      {loadError && (
        <div
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            zIndex: 9999,
            background: "white",
            padding: 10,
            borderRadius: 8,
          }}
        >
          שגיאה בטעינת אקסל: {loadError}
        </div>
      )}



      <SideBar
        isOpen={isSidebarOpen}
        onOpen={() => setIsSidebarOpen(true)}
        onClose={() => setIsSidebarOpen(false)}
        categoriesStructure={categoriesStructure}
        activeFilters={activeFilters}
        toggleFilter={toggleFilter}
      />

      <SearchBar
        query={query}
        setQuery={(v) => {
          setQuery(v);
          setShowResults(true);
        }}
        clear={() => {
          setQuery("");
          setShowResults(false);
        }}
        showResults={showResults}
        setShowResults={setShowResults}
        results={results}
        onPick={goToPoint}
      />

      <Chat isOpen={isChatOpen} setIsOpen={setIsChatOpen} />

      <div
        className={`${controlsStyles.controls} ${
          isSidebarOpen ? controlsStyles.hidden : ""
        }`}
      >
        {/* מרכז עומר */}
        <button
          className={controlsStyles.btn}
          onClick={() => mapRef.current?.flyTo(OMER_CENTER, 15)}
          title="מרכז עומר"
        >
          🏠
        </button>

        {/* מיקום עצמי */}
        <button
          className={`${controlsStyles.btn} ${isTracking ? controlsStyles.tracking : ""}`}
          onClick={handleLocate}
          title={isTracking ? "עצור מעקב" : "התחל מעקב מיקום"}
        >
          {isTracking ? "📍" : "🎯"}
        </button>

        {/* המבורגר */}
        <button
          className={controlsStyles.btn}
          onClick={() => setIsSidebarOpen(true)}
          title="תפריט"
        >
          ☰
        </button>
      </div>

      <MapView
        center={OMER_CENTER}
        mapRef={mapRef}
        markerRefs={markerRefs}
        userLocation={userLocation}
        points={filteredPoints}
        onMarkerClick={goToPoint}
      />
    </div>
  </div>
  );
}

