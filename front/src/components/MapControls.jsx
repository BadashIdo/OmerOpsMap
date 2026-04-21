/**
 * MapControls — floating button panel in the bottom-right corner of the map.
 *
 * Renders action buttons for:
 *  - Fly to city center (Omer)
 *  - Toggle real-time GPS location tracking
 *  - Open the Temporary Events list panel
 *  - Open the Admin panel (admin users only)
 *  - Open the Sidebar category filter
 *  - Log out / switch between guest and admin
 *
 * The panel hides itself when the sidebar is open to avoid overlap.
 * Buttons with live counts (events, pending requests) show a red badge.
 *
 * Props:
 *  mapRef              — Leaflet map ref (for flyTo)
 *  isTracking          — whether GPS tracking is currently active
 *  onLocate            — toggle GPS tracking
 *  temporarySitesCount — total number of active temporary events (badge)
 *  onOpenTempPanel     — open the TemporaryEventsPanel
 *  isAdmin             — whether the current user is an admin
 *  onOpenAdmin         — open the AdminPanel
 *  onOpenSidebar       — open the SideBar filter menu
 *  isSidebarOpen       — hides the panel when true
 */

import styles from "../styles/MapControls.module.css";
import { OMER_CENTER } from "../lib/constants";

export default function MapControls({
  mapRef,
  isTracking,
  onLocate,
  temporarySitesCount,
  onOpenTempPanel,
  isAdmin,
  onOpenAdmin,
  onOpenSidebar,
  isSidebarOpen,
}) {
  const handleExit = () => {
    if (confirm("האם לצאת ולחזור לבחירת משתמש?\n(אורח / מנהל)")) {
      sessionStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className={`${styles.controls} ${isSidebarOpen ? styles.hidden : ""}`}>
      {/* Fly to city center */}
      <button
        className={styles.btn}
        onClick={() => mapRef.current?.flyTo(OMER_CENTER, 15)}
        title="מרכז עומר"
      >
        🏠
      </button>

      {/* GPS tracking toggle */}
      <button
        className={`${styles.btn} ${isTracking ? styles.tracking : ""}`}
        onClick={onLocate}
        title={isTracking ? "עצור מעקב" : "התחל מעקב מיקום"}
      >
        {isTracking ? "📍" : "🎯"}
      </button>

      {/* Temporary events — shows live count badge */}
      <button
        className={styles.btn}
        onClick={onOpenTempPanel}
        title="אירועים זמניים"
        style={{ position: "relative" }}
      >
        ⚡
        {temporarySitesCount > 0 && (
          <span className={styles.badge}>{temporarySitesCount}</span>
        )}
      </button>

      {/* Admin panel — only visible to admins */}
      {isAdmin && (
        <button
          className={styles.btn}
          onClick={onOpenAdmin}
          title="ניהול מערכת"
          style={{
            background: "linear-gradient(135deg, #1a2a6c 0%, #2a5298 100%)",
            color: "white",
          }}
        >
          🔧
        </button>
      )}

      {/* Open the sidebar / category filter */}
      <button className={styles.btn} onClick={onOpenSidebar} title="תפריט">
        ☰
      </button>

      {/* Log out / switch user */}
      <button
        className={`${styles.btn} ${styles.exitBtn}`}
        onClick={handleExit}
        title="יציאה ושינוי משתמש"
      >
        <span style={{ fontSize: "20px" }}>⎋</span>
      </button>
    </div>
  );
}
