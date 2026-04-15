/**
 * MapPage — the main application screen.
 *
 * This component is intentionally slim: it wires together data hooks,
 * passes derived state to child components, and handles the few pieces of
 * coordination logic that genuinely don't belong anywhere else.
 *
 * ── What lives HERE (coordination) ──
 *  - Panel open/close state (sidebar, admin, chat, events, request form)
 *  - WebSocket message handler (triggers re-fetches + notifications)
 *  - Map navigation: goToPoint(), handleMapLongPress()
 *  - Data refresh trigger (a counter incremented on every WS data-changed event)
 *
 * ── What lives in HOOKS ──
 *  useSites          → fetches + normalizes permanent sites
 *  useTemporarySites → fetches temporary events
 *  useWebSocket      → manages the WS connection with auto-reconnect
 *  useFilters        → filter state, filteredPoints, categoriesStructure
 *  useSearch         → search query and scored results
 *  useGeoLocation    → GPS tracking
 *  useNotifications  → toast list + pending admin badge count
 */

import { useRef, useState, useCallback } from "react";
import "../styles/App.css";
import appStyles from "../styles/App.module.css";

import { useAuth } from "../context/AuthContext";
import { useSites } from "../hooks/useSites";
import { useTemporarySites } from "../hooks/useTemporarySites";
import { useWebSocket } from "../hooks/useWebSocket";
import { useFilters } from "../hooks/useFilters";
import { useSearch } from "../hooks/useSearch";
import { useGeoLocation } from "../hooks/useGeoLocation";
import { useNotifications } from "../hooks/useNotifications";

import MapView from "../components/MapView";
import MapControls from "../components/MapControls";
import SideBar from "../components/SideBar";
import SearchBar from "../components/SearchBar";
import ChatBot from "../components/ChatBot";
import AdminPanel from "../components/AdminPanel";
import RequestForm from "../components/RequestForm";
import TemporaryEventsPanel from "../components/TemporaryEventsPanel";
import NotificationToast from "../components/NotificationToast";

export default function MapPage() {
  const { isAdmin } = useAuth();

  // Incrementing this triggers a re-fetch in useSites / useTemporarySites
  const [dataRefreshTrigger, setDataRefreshTrigger] = useState(0);
  const refreshData = useCallback(() => setDataRefreshTrigger((prev) => prev + 1), []);

  // ── Raw data from API ──────────────────────────────────────────────────────
  const { points, loadError } = useSites(dataRefreshTrigger);
  const { temporarySites } = useTemporarySites(dataRefreshTrigger);

  // ── Map refs (passed to Leaflet and marker registry) ──────────────────────
  const mapRef = useRef(null);
  const markerRefs = useRef({});

  // ── Panel visibility ───────────────────────────────────────────────────────
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isTempPanelOpen, setIsTempPanelOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // ── Request form ───────────────────────────────────────────────────────────
  const [requestFormOpen, setRequestFormOpen] = useState(false);
  const [requestLocation, setRequestLocation] = useState(null);

  // ── Business logic hooks ───────────────────────────────────────────────────
  const { notifications, addNotification, removeNotification, pendingCount, setPendingCount } =
    useNotifications();

  const { activeFilters, toggleFilter, categoriesStructure, filteredPoints, filteredTemporarySites } =
    useFilters({ points, temporarySites });

  const { query, setQuery, showResults, setShowResults, results } = useSearch({
    filteredPoints,
    filteredTemporarySites,
  });

  const { userLocation, isTracking, handleLocate } = useGeoLocation(mapRef);

  // ── WebSocket message handler ──────────────────────────────────────────────
  const handleWebSocketMessage = useCallback(
    (message) => {
      if (message.type !== "data_changed") return;

      // Refresh the site/event lists whenever the server signals a change
      refreshData();

      const actionText =
        { create: "נוסף", update: "עודכן", delete: "נמחק", expired: "פג תוקפו" }[
          message.action
        ] || "שונה";
      const typeText = message.data_type === "temporary" ? "אירוע זמני" : "אתר";
      const name = message.data?.name || "";
      const isDestructive = message.action === "delete" || message.action === "expired";

      addNotification(`${typeText} ${actionText}: ${name}`, isDestructive ? "warning" : "update");

      // Admin-only: badge and notification for new requests
      if (message.data_type === "request" && message.action === "new" && isAdmin) {
        addNotification(`בקשה חדשה: ${name}`, "info");
        setPendingCount((prev) => prev + 1);
      }

      // Decrement badge when a request is resolved
      if (
        message.data_type === "request" &&
        (message.action === "approved" || message.action === "rejected")
      ) {
        setPendingCount((prev) => Math.max(0, prev - 1));
      }
    },
    [addNotification, isAdmin, setPendingCount]
  );

  useWebSocket(handleWebSocketMessage);

  // ── Map interactions ───────────────────────────────────────────────────────

  /**
   * Fly the map to a site and open its popup.
   * Accepts items from both search results and the temporary events panel.
   */
  const goToPoint = useCallback((p) => {
    setQuery(p.name);
    setShowResults(false);

    const map = mapRef.current;
    if (!map) return;

    // Always zoom to 18 so the marker is never inside a cluster when we open the popup
    const targetZoom = 18;

    // Same offset as handleMarkerClick — pin at screen center, popup opens above it
    const projected = map.project([p.lat, p.lng], targetZoom);
    const centered = map.unproject([projected.x, projected.y - 150], targetZoom);
    map.flyTo(centered, targetZoom, { animate: true, duration: 0.8, noMoveStart: true });

    // Open popup after the fly animation completes
    setTimeout(() => {
      let markerKey = `permanent-${p.id}`;
      if (p._type === "temporary") {
        markerKey = `temporary-${p.id}`;
      } else if (!markerRefs.current[markerKey] && markerRefs.current[`temporary-${p.id}`]) {
        markerKey = `temporary-${p.id}`;
      }
      markerRefs.current[markerKey]?.openPopup();
    }, 900);
  }, [mapRef, markerRefs, setQuery, setShowResults]);

  /** Long-press on the map opens the RequestForm at the pressed location. */
  const handleMapLongPress = useCallback((location) => {
    setRequestLocation(location);
    setRequestFormOpen(true);
  }, []);

  /**
   * Called when the user clicks a marker directly on the map.
   * Leaflet opens the popup automatically — we only need to sync the search bar.
   * (goToPoint is reserved for search results where we need to fly + open popup.)
   */
  const handleMarkerClick = useCallback((p) => {
    setQuery(p.name);
    setShowResults(false);
    const map = mapRef.current;
    if (!map) return;
    // Offset upward so the pin sits at screen center and the popup opens above it
    const zoom = map.getZoom();
    const projected = map.project([p.lat, p.lng], zoom);
    const centered = map.unproject([projected.x, projected.y - 150], zoom);
    map.panTo(centered);
  }, [setQuery, setShowResults, mapRef]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className={appStyles.shell}>
      <div className={appStyles.mapLayer}>

        {/* Data load error banner */}
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

        {/* ── Panels & overlays ── */}

        <SideBar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          categoriesStructure={categoriesStructure}
          activeFilters={activeFilters}
          toggleFilter={toggleFilter}
        />

        <SearchBar
          query={query}
          setQuery={(v) => { setQuery(v); setShowResults(true); }}
          clear={() => { setQuery(""); setShowResults(false); }}
          showResults={showResults}
          setShowResults={setShowResults}
          results={results}
          onPick={goToPoint}
        />

        <TemporaryEventsPanel
          isOpen={isTempPanelOpen}
          onClose={() => setIsTempPanelOpen(false)}
          events={temporarySites}
          onEventClick={(event) => {
            mapRef.current?.flyTo([event.lat, event.lng], 17, { animate: true, duration: 0.8 });
          }}
        />

        {isAdmin && (
          <AdminPanel
            isOpen={isAdminPanelOpen}
            onClose={() => setIsAdminPanelOpen(false)}
            onDataChange={refreshData}
          />
        )}

        <RequestForm
          isOpen={requestFormOpen}
          onClose={() => { setRequestFormOpen(false); setRequestLocation(null); }}
          location={requestLocation}
          categoriesStructure={categoriesStructure}
          onSuccess={() => addNotification("הבקשה נשלחה בהצלחה!", "success")}
        />

        {/* ── Map controls (floating button panel) ── */}
        <MapControls
          mapRef={mapRef}
          isTracking={isTracking}
          onLocate={handleLocate}
          temporarySitesCount={temporarySites.length}
          onOpenTempPanel={() => setIsTempPanelOpen(true)}
          isAdmin={isAdmin}
          pendingCount={pendingCount}
          onOpenAdmin={() => setIsAdminPanelOpen(true)}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          isSidebarOpen={isSidebarOpen}
        />

        {/* ── Toast notifications ── */}
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

        {/* ── AI ChatBot ── */}
        <ChatBot isOpen={isChatOpen} setIsOpen={setIsChatOpen} />

        {/* ── The Leaflet map (full screen, behind everything else) ── */}
        <MapView
          mapRef={mapRef}
          markerRefs={markerRefs}
          userLocation={userLocation}
          points={filteredPoints}
          temporarySites={filteredTemporarySites}
          onMarkerClick={handleMarkerClick}
          onLongPress={handleMapLongPress}
        />
      </div>
    </div>
  );
}
