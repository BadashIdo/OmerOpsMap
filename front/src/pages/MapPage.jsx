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

import { useRef, useState, useCallback, useEffect } from "react";
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
import NotificationToast from "../components/NotificationToast";
import SiteEditModal from "../components/admin/SiteEditModal";
import FeedbackButton from "../components/FeedbackButton";
import AlertBanner from "../components/AlertBanner";
import LayersControl from "../components/LayersControl";
import WeatherWidget from "../components/WeatherWidget";
import { useExternalFeatures } from "../hooks/useExternalFeatures";
import { EXTERNAL_LAYERS } from "../lib/constants";

export default function MapPage() {
  const { admin, isAdmin, getAuthHeader } = useAuth();

  // Incrementing this triggers a re-fetch in useSites / useTemporarySites
  const [dataRefreshTrigger, setDataRefreshTrigger] = useState(0);
  const refreshData = useCallback(() => setDataRefreshTrigger((prev) => prev + 1), []);

  // Incrementing this triggers a re-fetch in AdminPanel's feedback tab + count badge
  const [feedbackRefreshTrigger, setFeedbackRefreshTrigger] = useState(0);
  const refreshFeedback = useCallback(() => setFeedbackRefreshTrigger((prev) => prev + 1), []);

  // ── Raw data from API ──────────────────────────────────────────────────────
  const { points, loadError } = useSites(dataRefreshTrigger);
  const { temporarySites } = useTemporarySites(dataRefreshTrigger);

  // ── Map refs (passed to Leaflet and marker registry) ──────────────────────
  const mapRef = useRef(null);
  const markerRefs = useRef({});
  const clusterRef = useRef(null);

  // ── Panel visibility ───────────────────────────────────────────────────────
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isLayersOpen, setIsLayersOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [showTemporarySites, setShowTemporarySites] = useState(true);

  // ── Dark Mode ──────────────────────────────────────────────────────────────
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add("dark-mode");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.remove("dark-mode");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  // ── External layer visibility (per-source toggle in LayersControl) ─────────
  const [visibleLayers, setVisibleLayers] = useState(() =>
    Object.fromEntries(EXTERNAL_LAYERS.map((l) => [l.id, l.defaultVisible]))
  );
  const toggleLayer = useCallback((layerId) => {
    setVisibleLayers((prev) => ({ ...prev, [layerId]: !prev[layerId] }));
  }, []);

  // Bumped per-source when a "data_changed" event for type="external" arrives.
  // Each source has its own counter so an oref event doesn't cause TomTom refetch.
  const [externalRefreshTriggers, setExternalRefreshTriggers] = useState(() =>
    Object.fromEntries(EXTERNAL_LAYERS.map((l) => [l.id, 0]))
  );
  const bumpExternalSource = useCallback((source) => {
    setExternalRefreshTriggers((prev) => ({ ...prev, [source]: (prev[source] || 0) + 1 }));
  }, []);

  // ── Admin site management ──────────────────────────────────────────
  const [siteEditModalOpen, setSiteEditModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState(null);
  const [editingSiteType, setEditingSiteType] = useState("permanent");

  // ── Business logic hooks ───────────────────────────────────────────────────
  const { notifications, addNotification, removeNotification } =
    useNotifications();

  const { activeFilters, toggleFilter, toggleGroup, categoriesStructure, filteredPoints, filteredTemporarySites } =
    useFilters({ points, temporarySites });

  const { query, setQuery, showResults, setShowResults, results } = useSearch({
    points,
    temporarySites,
  });

  const { userLocation, isTracking, handleLocate } = useGeoLocation(mapRef);

  // ── WebSocket message handler ──────────────────────────────────────────────
  const handleWebSocketMessage = useCallback(
    (message) => {
      try {
        if (message?.type !== "data_changed") return;

        // Feedback events: only admins care; refresh the feedback list/badge.
        if (message.data_type === "feedback") {
          refreshFeedback();
          if (admin?.role === "admin" && message.action === "create") {
            addNotification("התקבל משוב חדש", "update");
          }
          return;
        }

        // External integration events — refresh only the affected source.
        if (message.data_type === "external") {
          const source = message.data?.source;
          if (source) bumpExternalSource(source);
          return;
        }

        refreshData();

        const actionText =
          { create: "נוסף", update: "עודכן", delete: "נמחק", expired: "פג תוקפו" }[
            message.action
          ] || "שונה";
        const typeText = message.data_type === "temporary" ? "אירוע זמני" : "אתר";
        const name = message.data?.name || "לא ידוע";
        const isDestructive = message.action === "delete" || message.action === "expired";

        addNotification(`${typeText} ${actionText}: ${name}`, isDestructive ? "warning" : "update");
      } catch (err) {
        console.error("Error handling WebSocket message:", err);
      }
    },
    [addNotification, admin, refreshData, refreshFeedback, bumpExternalSource]
  );

  useWebSocket(handleWebSocketMessage);

  // ── External feature streams — one hook per source (only when visible) ─────
  // Note: hook order is fixed per render — calling them all unconditionally
  // and gating with `enabled` keeps React happy.
  const orefFeatures = useExternalFeatures(
    "oref_alert",
    !!visibleLayers.oref_alert,
    externalRefreshTriggers.oref_alert
  );
  const tomtomFeatures = useExternalFeatures(
    "tomtom_traffic",
    !!visibleLayers.tomtom_traffic,
    externalRefreshTriggers.tomtom_traffic
  );
  const weatherFeatures = useExternalFeatures(
    "openmeteo_weather",
    !!visibleLayers.openmeteo_weather,
    externalRefreshTriggers.openmeteo_weather
  );

  const externalFeaturesBySource = {
    oref_alert: orefFeatures.features,
    tomtom_traffic: tomtomFeatures.features,
    openmeteo_weather: weatherFeatures.features,
  };

  const layerInfo = {
    oref_alert: { lastSyncedAt: orefFeatures.lastSyncedAt, error: orefFeatures.error },
    tomtom_traffic: { lastSyncedAt: tomtomFeatures.lastSyncedAt, error: tomtomFeatures.error },
    openmeteo_weather: { lastSyncedAt: weatherFeatures.lastSyncedAt, error: weatherFeatures.error },
  };

  // Active oref alerts for the AlertBanner — only ones not stale.
  const activeOrefAlerts = visibleLayers.oref_alert
    ? orefFeatures.features.filter((f) => !f.is_stale)
    : [];

  // ── Map interactions ───────────────────────────────────────────────────────

  /**
   * Fly the map to a site and open its popup.
   * Accepts items from both search results and the temporary events panel.
   * Auto-enables subcategory and district filters if they're not currently visible.
   */
  const goToPoint = useCallback((p) => {
    setQuery(p.name);
    setShowResults(false);

    // Check if the site's subcategory is visible; if not, toggle it
    const subCat = p.sub_category || p.subCategory;
    if (subCat && !activeFilters.includes(subCat)) {
      toggleFilter(subCat);
    }

    // Check if the site's district is visible; if not, toggle it
    const district = p.district;
    if (district && !activeFilters.includes(district)) {
      toggleFilter(district);
    }

    const map = mapRef.current;
    if (!map) return;

    // Set target zoom to 21 (almost max zoom)
    const targetZoom = 21;

    // Same offset as handleMarkerClick — pin at screen center, popup opens above it
    const projected = map.project([p.lat, p.lng], targetZoom);
    const centered = map.unproject([projected.x, projected.y - 150], targetZoom);

    // Duration set to 2.5s for a very slow, smooth sweep
    map.flyTo(centered, targetZoom, { animate: true, duration: 2.5, noMoveStart: true });

    // Wait for fly animation to complete (2.5s) + 0.5s before opening cluster/popup
    setTimeout(() => {
      let markerKey = `permanent-${p.id}`;
      if (p._type === "temporary") {
        markerKey = `temporary-${p.id}`;
      } else if (!markerRefs.current[markerKey] && markerRefs.current[`temporary-${p.id}`]) {
        markerKey = `temporary-${p.id}`;
      }

      const marker = markerRefs.current[markerKey];
      if (!marker) return;

      const clusterGroup = clusterRef.current;
      if (clusterGroup && clusterGroup.getVisibleParent) {
        const parent = clusterGroup.getVisibleParent(marker);
        if (parent && parent.spiderfy) {
          // It's a cluster. Spiderfy it manually without changing the map's zoom!
          parent.spiderfy();
          // Small delay to let the spiderfy animation complete before opening the popup
          setTimeout(() => {
            marker.openPopup();
          }, 300);
        } else {
          // It's already visible on the map
          marker.openPopup();
        }
      } else {
        marker.openPopup();
      }
    }, 3100);
  }, [mapRef, markerRefs, clusterRef, setQuery, setShowResults, activeFilters, toggleFilter]);

  /** Long-press on the map: admin or subadmin — opens SiteEditModal to create a new permanent site. */
  const handleMapLongPress = useCallback(
    (location) => {
      if (admin) {
        setEditingSite({ lat: location.lat, lng: location.lng });
        setEditingSiteType("permanent");
        setSiteEditModalOpen(true);
      }
    },
    [admin]
  );

  /**
   * Called when the user clicks a marker directly on the map.
   * Leaflet opens the popup automatically — we only need to sync the search bar.
   * (goToPoint is reserved for search results where we need to fly + open popup.)
   */
  const handleMarkerClick = useCallback((p) => {
    setShowResults(false);
    const map = mapRef.current;
    if (!map) return;
    // Offset upward so the pin sits at screen center and the popup opens above it
    const zoom = map.getZoom();
    const projected = map.project([p.lat, p.lng], zoom);
    const centered = map.unproject([projected.x, projected.y - 150], zoom);
    map.panTo(centered);
  }, [setShowResults, mapRef]);

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
          toggleGroup={toggleGroup}
          showTemporarySites={showTemporarySites}
          setShowTemporarySites={setShowTemporarySites}
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

        {isAdmin && (
          <AdminPanel
            isOpen={isAdminPanelOpen}
            onClose={() => setIsAdminPanelOpen(false)}
            onDataChange={refreshData}
            categoriesStructure={categoriesStructure}
            onLocateSite={(site) => {
              setIsAdminPanelOpen(false);
              goToPoint(site);
            }}
            onLocateFeedback={(lat, lng) => {
              setIsAdminPanelOpen(false);
              goToPoint({ name: "מיקום המשוב", lat, lng });
            }}
            feedbackRefreshTrigger={feedbackRefreshTrigger}
          />
        )}

        {siteEditModalOpen && (
          <SiteEditModal
            site={editingSite}
            siteType={editingSiteType}
            authHeader={getAuthHeader()}
            categoriesStructure={categoriesStructure}
            onClose={() => { setSiteEditModalOpen(false); setEditingSite(null); }}
            onSave={(isDeleted) => {
              setSiteEditModalOpen(false);
              setEditingSite(null);
              refreshData();
              if (isDeleted) {
                addNotification("האתר נמחק בהצלחה!", "success");
              } else {
                addNotification(editingSite?.id ? "האתר עודכן בהצלחה!" : "האתר נוסף בהצלחה!", "success");
              }
            }}
          />
        )}

        {/* ── Map controls (floating button panel) ── */}
        <MapControls
          mapRef={mapRef}
          isTracking={isTracking}
          onLocate={handleLocate}
          isAdmin={isAdmin}
          onOpenAdmin={() => setIsAdminPanelOpen(true)}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          isSidebarOpen={isSidebarOpen}
          onOpenLayers={() => setIsLayersOpen(true)}
          activeLayersCount={Object.values(visibleLayers).filter(Boolean).length}
          onOpenFeedback={() => setIsFeedbackOpen(true)}
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

        {/* ── Feedback button (visible to everyone, including guests) ── */}
        <FeedbackButton open={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />

        {/* ── AI ChatBot ── */}
        <ChatBot
          isOpen={isChatOpen}
          setIsOpen={setIsChatOpen}
          onSiteClick={goToPoint}
          allSites={[...points, ...temporarySites]}
        />

        {/* ── Pikud Haoref alert banner (top, only when active oref alert) ── */}
        <AlertBanner alerts={activeOrefAlerts} />

        {/* ── Weather widget (top-start corner, only when layer is on) ── */}
        {visibleLayers.openmeteo_weather && (
          <WeatherWidget
            feature={weatherFeatures.features[0]}
            lastSyncedAt={weatherFeatures.lastSyncedAt}
            isLoading={weatherFeatures.isLoading}
          />
        )}

        {/* ── External-layers toggle (round trigger → modal sheet) ── */}
        <LayersControl
          open={isLayersOpen}
          onClose={() => setIsLayersOpen(false)}
          visibleLayers={visibleLayers}
          onToggle={toggleLayer}
          layerInfo={layerInfo}
          isDarkMode={isDarkMode}
          toggleDarkMode={() => setIsDarkMode((prev) => !prev)}
        />

        {/* ── The Leaflet map (full screen, behind everything else) ── */}
        <MapView
          mapRef={mapRef}
          markerRefs={markerRefs}
          clusterRef={clusterRef}
          userLocation={userLocation}
          points={filteredPoints}
          temporarySites={showTemporarySites ? filteredTemporarySites : []}
          externalFeaturesBySource={externalFeaturesBySource}
          visibleLayers={visibleLayers}
          onMarkerClick={handleMarkerClick}
          onLongPress={handleMapLongPress}
          isAdmin={isAdmin}
          onEditSite={(site, type) => {
            setEditingSite(site);
            setEditingSiteType(type);
            setSiteEditModalOpen(true);
          }}
        />
      </div>
    </div>
  );
}
