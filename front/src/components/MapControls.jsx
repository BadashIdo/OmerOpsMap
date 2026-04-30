import { useState } from "react";
import styles from "../styles/MapControls.module.css";
import { OMER_CENTER } from "../lib/constants";
import ConfirmDialog from "./ConfirmDialog";

export default function MapControls({
  mapRef,
  isTracking,
  onLocate,
  isAdmin,
  onOpenAdmin,
  onOpenSidebar,
  isSidebarOpen,
  onOpenLayers,
  activeLayersCount,
  onOpenFeedback,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const toggle = () => setIsExpanded((v) => !v);

  const handleAction = (fn) => {
    fn?.();
  };

  return (
    <div className={`${styles.controls} ${isSidebarOpen ? styles.hidden : ""}`}>
      {/* Expandable buttons */}
      <div className={`${styles.speedDial} ${isExpanded ? styles.open : ""}`}>
        {/* Feedback — topmost */}
        <button
          className={`${styles.btn} ${styles.dialBtn} ${styles.feedbackBtn}`}
          onClick={() => handleAction(onOpenFeedback)}
          title="דיווח"
        >
          📣
        </button>

        {/* Fly to city center */}
        <button
          className={`${styles.btn} ${styles.dialBtn}`}
          onClick={() => handleAction(() => mapRef.current?.flyTo(OMER_CENTER, 15))}
          title="מרכז עומר"
        >
          🏠
        </button>

        {/* GPS tracking toggle */}
        <button
          className={`${styles.btn} ${styles.dialBtn} ${isTracking ? styles.tracking : ""}`}
          onClick={() => handleAction(onLocate)}
          title={isTracking ? "עצור מעקב" : "מיקום"}
        >
          {isTracking ? "📍" : "🎯"}
        </button>

        {/* Admin panel — only visible to admins */}
        {isAdmin && (
          <button
            className={`${styles.btn} ${styles.dialBtn}`}
            onClick={() => handleAction(onOpenAdmin)}
            title="ניהול מערכת"
            style={{
              background: "linear-gradient(135deg, #1a2a6c 0%, #2a5298 100%)",
              color: "white",
            }}
          >
            🔧
          </button>
        )}

        {/* External layers */}
        <button
          className={`${styles.btn} ${styles.dialBtn}`}
          onClick={() => handleAction(onOpenLayers)}
          title="שכבות חיצוניות"
          style={{ position: "relative" }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>settings</span>
          {activeLayersCount > 0 && (
            <span className={styles.badge}>{activeLayersCount}</span>
          )}
        </button>

        {/* Sidebar / category filter */}
        <button
          className={`${styles.btn} ${styles.dialBtn}`}
          onClick={() => handleAction(onOpenSidebar)}
          title="תפריט"
        >
          ☰
        </button>

        {/* Exit */}
        <button
          className={`${styles.btn} ${styles.dialBtn} ${styles.exitBtn}`}
          onClick={() => { setIsExpanded(false); setShowExitConfirm(true); }}
          title="יציאה ושינוי משתמש"
        >
          <span style={{ fontSize: "20px" }}>⎋</span>
        </button>
      </div>

      {/* Toggle button — always visible */}
      <button
        className={`${styles.btn} ${styles.toggleBtn} ${isExpanded ? styles.toggleOpen : ""}`}
        onClick={toggle}
        title="תפריט פעולות"
      >
        <span className={styles.toggleIcon}>
          {isExpanded ? (
            "✕"
          ) : (
            <span className="material-symbols-outlined" style={{ fontSize: "28px" }}>layers</span>
          )}
        </span>
      </button>

      <ConfirmDialog
        open={showExitConfirm}
        title="יציאה"
        message={"האם לצאת ולחזור לבחירת משתמש?\n(אורח / מנהל)"}
        confirmLabel="יציאה"
        cancelLabel="ביטול"
        confirmVariant="danger"
        onConfirm={() => { sessionStorage.clear(); window.location.reload(); }}
        onCancel={() => setShowExitConfirm(false)}
      />
    </div>
  );
}
