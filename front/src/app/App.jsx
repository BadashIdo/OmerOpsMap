import { useMemo, useRef, useState, useEffect } from "react";
import "../styles/App.css";
import appStyles from "../styles/App.module.css";
import controlsStyles from "../styles/MapControls.module.css";
import { useSites } from "../hooks/useSites";
import { useTemporarySites } from "../hooks/useTemporarySites";
import { useWebSocket } from "../hooks/useWebSocket";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { normalize } from "../lib/text";

import SideBar from "../components/SideBar";
import SearchBar from "../components/SearchBar";
import MapView from "../components/MapView";
import TemporaryEventsPanel from "../components/TemporaryEventsPanel";
import NotificationToast from "../components/NotificationToast";
import LoginPage from "../components/LoginPage";
import AdminPanel from "../components/AdminPanel";
import RequestForm from "../components/RequestForm";
import ChatBot from "../components/ChatBot";


const OMER_CENTER = [31.2632, 34.8419];
const DISTRICTS = ["רובע א'", "רובע ב'", "רובע ג'", "רובע ד'", "פארק תעשיות"];

function AppContent() {
  const { isAdmin, isLoading: authLoading } = useAuth();

  // Data refresh trigger for WebSocket updates
  const [dataRefreshTrigger, setDataRefreshTrigger] = useState(0);

  // Load sites from API
  const { points, loadError } = useSites(dataRefreshTrigger);
  const { temporarySites } = useTemporarySites(dataRefreshTrigger);

  const mapRef = useRef(null);
  const markerRefs = useRef({});
  const watchIdRef = useRef(null);

  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isTempPanelOpen, setIsTempPanelOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Request form state
  const [requestFormOpen, setRequestFormOpen] = useState(false);
  const [requestLocation, setRequestLocation] = useState(null);

  // Notifications
  const [notifications, setNotifications] = useState([]);

  // Pending requests count for admin badge
  const [pendingCount, setPendingCount] = useState(0);

  // WebSocket for real-time updates
  useWebSocket((message) => {
    console.log("WebSocket message:", message);

    if (message.type === "data_changed") {
      // Refresh data when changes occur
      setDataRefreshTrigger((prev) => prev + 1);

      // Show notification
      const actionText = {
        create: "נוסף",
        update: "עודכן",
        delete: "נמחק",
        expired: "פג תוקפו"
      }[message.action] || "שונה";

      const typeText = message.data_type === "temporary" ? "אירוע זמני" : "אתר";
      const name = message.data?.name || "";

      addNotification(`${typeText} ${actionText}: ${name}`, message.action === "delete" || message.action === "expired" ? "warning" : "update");
    }

    // Handle new request notification for admins
    if (message.type === "data_changed" && message.data_type === "request" && message.action === "new") {
      if (isAdmin) {
        addNotification(`בקשה חדשה: ${message.data?.name || ""}`, "info");
        setPendingCount((prev) => prev + 1);
      }
    }

    // Handle request approved/rejected
    if (message.type === "data_changed" && message.data_type === "request") {
      if (message.action === "approved" || message.action === "rejected") {
        setPendingCount((prev) => Math.max(0, prev - 1));
      }
    }
  });

  // Add notification helper
  const addNotification = (message, type = "info") => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type }]);
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Handle long press on map
  const handleMapLongPress = (location) => {
    setRequestLocation(location);
    setRequestFormOpen(true);
  };

  /**
   * מחשב מרחק בין שתי נקודות גיאוגרפיות (Haversine formula)
   */
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // רדיוס כדור הארץ בק"מ
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // מרחק בק"מ
  };

  /**
   * מוצא את הרובע הקרוב ביותר לנקודה לפי המרחק הגיאוגרפי
   */
  const findClosestDistrict = (targetLat, targetLng, allPoints) => {
    // נקודות עם district תקין (לא ריק ולא "-")
    const pointsWithDistrict = allPoints.filter(p =>
      p.district &&
      p.district !== "-" &&
      p.district !== "" &&
      p.lat && p.lng
    );

    if (pointsWithDistrict.length === 0) return null;

    let closestPoint = null;
    let minDistance = Infinity;

    pointsWithDistrict.forEach(p => {
      const distance = calculateDistance(targetLat, targetLng, p.lat, p.lng);
      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = p;
      }
    });

    return closestPoint?.district || null;
  };

  // תיקון אוטומטי של נקודות עם district = "-"
  const pointsWithFixedDistricts = useMemo(() => {
    const pointsNeedingFix = points.filter(p => !p.district || p.district === "-" || p.district.trim() === "");

    if (pointsNeedingFix.length === 0) return points;

    console.log(`🔧 Found ${pointsNeedingFix.length} points with missing district, fixing...`);

    const fixedPoints = points.map(p => {
      if (!p.district || p.district === "-" || p.district.trim() === "") {
        const closestDistrict = findClosestDistrict(p.lat, p.lng, points);
        if (closestDistrict) {
          console.log(`   Fixed point ${p.id} (${p.name}): "${p.district || '(empty)'}" → "${closestDistrict}"`);
          return { ...p, district: closestDistrict };
        }
      }
      return p;
    });

    return fixedPoints;
  }, [points]);

  // כל תתי-הקטגוריות (מתוך points!)
  const allSubCategories = useMemo(() => {
    const subCats = [...new Set(pointsWithFixedDistricts.map((p) => p.subCategory))].filter(Boolean);

    // Debug: Check how many points have empty subCategory
    const pointsWithEmptySubCat = points.filter(p => !p.subCategory || p.subCategory.trim() === '');
    if (pointsWithEmptySubCat.length > 0) {
      console.log(`📋 Points with empty subCategory: ${pointsWithEmptySubCat.length} out of ${points.length}`);
      console.log(`   Examples:`, pointsWithEmptySubCat.slice(0, 5).map(p => ({
        id: p.id,
        name: p.name,
        category: p.category || '(empty)',
        subCategory: p.subCategory || '(empty)'
      })));
    }

    return subCats;
  }, [pointsWithFixedDistricts]);

  // All temporary event categories
  const allTempCategories = useMemo(
    () => [...new Set(temporarySites.map((t) => t.category))].filter(Boolean),
    [temporarySites]
  );

  // פילטרים דיפולטיים: בהתחלה "הכול דלוק"
  const [activeFilters, setActiveFilters] = useState([]);

  // ברגע שהדאטה נטען בפעם הראשונה, נדליק את כולם (רק אם עדיין ריק)
  useMemo(() => {
    if (activeFilters.length === 0 && allSubCategories.length > 0) {
      // מוסיפים גם את תתי-הקטגוריות וגם את הרובעים וגם קטגוריות זמניות
      setActiveFilters([...allSubCategories, ...DISTRICTS, ...allTempCategories, "אירועים זמניים"]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allSubCategories, allTempCategories]);

  const categoriesStructure = useMemo(() => {
    const struct = {};
    pointsWithFixedDistricts.forEach((p) => {
      const mainCat = p.category || "ללא קטגוריה";
      const subCat = p.subCategory;

      if (!struct[mainCat]) struct[mainCat] = new Set();
      if (subCat) struct[mainCat].add(subCat);
    });

    // הוספת קטגוריית רובעים ידנית
    struct["רובעים"] = DISTRICTS;

    // Add temporary events category
    if (allTempCategories.length > 0) {
      struct["אירועים זמניים"] = allTempCategories;
    }

    return Object.fromEntries(
      Object.entries(struct).map(([k, v]) => [k, Array.isArray(v) ? v : Array.from(v)])
    );
  }, [pointsWithFixedDistricts, allTempCategories]);

  const filteredPoints = useMemo(() => {
    if (activeFilters.length === 0) return pointsWithFixedDistricts;

    // הפרדה בין רובעים לתתי-קטגוריות
    const activeDistricts = activeFilters.filter((f) => DISTRICTS.includes(f));
    const activeSubCategories = activeFilters.filter((f) => !DISTRICTS.includes(f) && !allTempCategories.includes(f) && f !== "אירועים זמניים");

    const filtered = pointsWithFixedDistricts.filter((p) => {
      // בדיקת רובע (אם יש רובעים פעילים)
      const districtMatch = activeDistricts.length === 0 || activeDistricts.includes(p.district);

      // בדיקת תת-קטגוריה:
      // - אם אין תתי-קטגוריות פעילות → כל הנקודות עוברות
      // - אם יש תתי-קטגוריות פעילות:
      //   * אם לנקודה יש subCategory תקין → היא עוברת רק אם הוא פעיל
      //   * אם לנקודה אין subCategory (ריק/null) → היא עוברת (תמיד)
      const subCategoryMatch = activeSubCategories.length === 0 ||
        !p.subCategory ||
        activeSubCategories.includes(p.subCategory);

      // האתר צריך לעמוד בשני התנאים (AND לוגי)
      return districtMatch && subCategoryMatch;
    });

    // Debug logging
    console.log(`🔍 Filtering: ${pointsWithFixedDistricts.length} total points, ${filtered.length} after filter`);
    console.log(`   Active districts: ${activeDistricts.length}, Active subCategories: ${activeSubCategories.length}`);
    if (pointsWithFixedDistricts.length !== filtered.length) {
      const filteredOut = pointsWithFixedDistricts.length - filtered.length;
      console.log(`   ⚠️ Filtered out ${filteredOut} points`);

      // Show which points were filtered out
      const filteredOutPoints = pointsWithFixedDistricts.filter((p) => {
        const districtMatch = activeDistricts.length === 0 || activeDistricts.includes(p.district);
        const subCategoryMatch = activeSubCategories.length === 0 ||
          !p.subCategory ||
          activeSubCategories.includes(p.subCategory);
        return !(districtMatch && subCategoryMatch);
      });

      if (filteredOutPoints.length > 0) {
        console.log(`   Filtered out points (${filteredOutPoints.length} total):`);
        // Show all filtered out points as a table for easier viewing
        console.table(filteredOutPoints.map(p => ({
          ID: p.id,
          Name: p.name || '(no name)',
          District: p.district || '(empty)',
          SubCategory: p.subCategory || '(empty)',
          Category: p.category || '(empty)',
          Reason: !activeDistricts.includes(p.district) ? 'District not active' :
            (!p.subCategory || !activeSubCategories.includes(p.subCategory)) ? 'SubCategory not active' : 'Unknown'
        })));
      }
    } else {
      console.log(`   ✅ All points are visible!`);
    }

    return filtered;
  }, [pointsWithFixedDistricts, activeFilters, allTempCategories]);

  // Filter temporary sites
  const filteredTemporarySites = useMemo(() => {
    if (activeFilters.length === 0) return temporarySites;

    const activeTempCategories = activeFilters.filter((f) => allTempCategories.includes(f));

    // If "אירועים זמניים" is not active, hide all temporary sites
    if (!activeFilters.includes("אירועים זמניים")) {
      return [];
    }

    // If no specific temp categories selected, show all
    if (activeTempCategories.length === 0) {
      return temporarySites;
    }

    return temporarySites.filter((t) => activeTempCategories.includes(t.category));
  }, [temporarySites, activeFilters, allTempCategories]);

  const results = useMemo(() => {
    const q = normalize(query);
    if (!q) return [];

    // Search in permanent sites
    const scoredPermanent = filteredPoints
      .map((p) => {
        const name = normalize(p.name);
        const address = normalize(p.address || "");
        const desc = normalize(p.description || "");

        let score = 0;
        if (name.startsWith(q)) score += 3;
        if (name.includes(q)) score += 2;
        if (address.includes(q)) score += 1;
        if (desc.includes(q)) score += 1;

        return { item: p, score, type: "permanent" };
      })
      .filter((x) => x.score > 0);

    // Search in temporary sites
    const scoredTemporary = filteredTemporarySites
      .map((t) => {
        const name = normalize(t.name);
        const desc = normalize(t.description || "");
        const category = normalize(t.category || "");

        let score = 0;
        if (name.startsWith(q)) score += 3;
        if (name.includes(q)) score += 2;
        if (category.includes(q)) score += 1;
        if (desc.includes(q)) score += 1;

        return { item: t, score, type: "temporary" };
      })
      .filter((x) => x.score > 0);

    // Combine and sort all results
    const allScored = [...scoredPermanent, ...scoredTemporary]
      .sort((a, b) => b.score - a.score);

    return allScored.slice(0, 8).map((x) => x.item);
  }, [query, filteredPoints, filteredTemporarySites]);

  const toggleFilter = (subCat) => {
    setActiveFilters((prev) =>
      prev.includes(subCat)
        ? prev.filter((c) => c !== subCat)
        : [...prev, subCat]
    );
  };

  const goToPoint = (p) => {
    setQuery(p.name);
    setShowResults(false);

    const map = mapRef.current;
    if (map) {
      // חישוב offset כדי שה-popup יופיע למטה
      const targetPoint = map.project([p.lat, p.lng], 17);
      const targetLatLng = map.unproject([targetPoint.x, targetPoint.y - 200], 17);

      map.flyTo(targetLatLng, 17, { animate: true, duration: 0.8, noMoveStart: true });

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
            map.flyTo([latitude, longitude], 16, { animate: true, duration: 0.8 });
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

  // Show login page while auth is loading or if not logged in
  if (authLoading) {
    return null; // LoginPage handles loading state
  }

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
            שגיאה בטעינת נתונים: {loadError}
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

        {/* Temporary Events Panel */}
        <TemporaryEventsPanel
          isOpen={isTempPanelOpen}
          onClose={() => setIsTempPanelOpen(false)}
          events={temporarySites}
          onEventClick={(event) => {
            // Navigate to event on map
            const map = mapRef.current;
            if (map) {
              map.flyTo([event.lat, event.lng], 17, { animate: true, duration: 0.8 });
            }
          }}
        />

        {/* Admin Panel */}
        {isAdmin && (
          <AdminPanel
            isOpen={isAdminPanelOpen}
            onClose={() => setIsAdminPanelOpen(false)}
            onDataChange={() => setDataRefreshTrigger((prev) => prev + 1)}
          />
        )}

        {/* Request Form */}
        <RequestForm
          isOpen={requestFormOpen}
          onClose={() => {
            setRequestFormOpen(false);
            setRequestLocation(null);
          }}
          location={requestLocation}
          onSuccess={() => {
            addNotification("הבקשה נשלחה בהצלחה!", "success");
          }}
        />

        {/* Notifications */}
        <div style={{ position: "fixed", top: 80, right: 20, zIndex: 10000 }}>
          {notifications.map((notif) => (
            <div key={notif.id} style={{ marginBottom: 10 }}>
              <NotificationToast
                message={notif.message}
                type={notif.type}
                onClose={() => removeNotification(notif.id)}
              />
            </div>
          ))}
        </div>

        {/* AI ChatBot - Bottom Left */}
        <ChatBot isOpen={isChatOpen} setIsOpen={setIsChatOpen} />

        <div
          className={`${controlsStyles.controls} ${isSidebarOpen ? controlsStyles.hidden : ""
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

          {/* אירועים זמניים */}
          <button
            className={controlsStyles.btn}
            onClick={() => setIsTempPanelOpen(true)}
            title="אירועים זמניים"
            style={{ position: "relative" }}
          >
            ⚡
            {temporarySites.length > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: -5,
                  right: -5,
                  background: "#f44336",
                  color: "white",
                  borderRadius: "50%",
                  width: 20,
                  height: 20,
                  fontSize: 11,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                }}
              >
                {temporarySites.length}
              </span>
            )}
          </button>

          {/* Admin Panel Button - Only for admins */}
          {isAdmin && (
            <button
              className={controlsStyles.btn}
              onClick={() => setIsAdminPanelOpen(true)}
              title="ניהול מערכת"
              style={{ position: "relative", background: "linear-gradient(135deg, #1a2a6c 0%, #2a5298 100%)", color: "white" }}
            >
              🔧
              {pendingCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: -5,
                    right: -5,
                    background: "#f44336",
                    color: "white",
                    borderRadius: "50%",
                    width: 20,
                    height: 20,
                    fontSize: 11,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "bold",
                  }}
                >
                  {pendingCount}
                </span>
              )}
            </button>
          )}

          {/* המבורגר */}
          <button
            className={controlsStyles.btn}
            onClick={() => setIsSidebarOpen(true)}
            title="תפריט"
          >
            ☰
          </button>

          {/* יציאה / שינוי משתמש */}
          <button
            className={`${controlsStyles.btn} ${controlsStyles.exitBtn}`}
            onClick={() => {
              if (confirm("האם לצאת ולחזור לבחירת משתמש?\n(אורח / מנהל)")) {
                sessionStorage.clear();
                window.location.reload();
              }
            }}
            title="יציאה ושינוי משתמש"
          >
            <span style={{ fontSize: '20px' }}>⎋</span>
          </button>
        </div>

        <MapView
          center={OMER_CENTER}
          mapRef={mapRef}
          markerRefs={markerRefs}
          userLocation={userLocation}
          points={filteredPoints}
          temporarySites={filteredTemporarySites}
          onMarkerClick={goToPoint}
          onLongPress={handleMapLongPress}
        />
      </div>
    </div>
  );
}

// Main App with AuthProvider
export default function App() {
  return (
    <AuthProvider>
      <AppWithAuth />
    </AuthProvider>
  );
}

function AppWithAuth() {
  const { admin, isLoading } = useAuth();

  // Check sessionStorage for guest entry on initial render
  const [hasEnteredAsGuest, setHasEnteredAsGuest] = useState(() => {
    return sessionStorage.getItem("omeropsmap_guest") === "true";
  });

  const handleGuestEntry = () => {
    sessionStorage.setItem("omeropsmap_guest", "true");
    setHasEnteredAsGuest(true);
  };

  if (isLoading) {
    return <LoginPage />;
  }

  // Show login if no admin and not entered as guest
  if (!admin && !hasEnteredAsGuest) {
    return <LoginPageWrapper onGuestEntry={handleGuestEntry} />;
  }

  return <AppContent />;
}

function LoginPageWrapper({ onGuestEntry }) {
  const { login, enterAsGuest, isLoading, error } = useAuth();
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState("");

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLocalError("");

    if (!username.trim()) {
      setLocalError("נא להזין שם משתמש");
      return;
    }
    if (!password) {
      setLocalError("נא להזין סיסמה");
      return;
    }

    const success = await login(username.trim(), password);
    if (!success) {
      setLocalError(error || "שגיאה בהתחברות");
    }
  };

  const handleGuestEntry = () => {
    enterAsGuest();
    onGuestEntry();
  };

  return (
    <LoginPage
      showLoginForm={showLoginForm}
      setShowLoginForm={setShowLoginForm}
      username={username}
      setUsername={setUsername}
      password={password}
      setPassword={setPassword}
      localError={localError}
      error={error}
      isLoading={isLoading}
      handleAdminLogin={handleAdminLogin}
      handleGuestEntry={handleGuestEntry}
    />
  );
}
