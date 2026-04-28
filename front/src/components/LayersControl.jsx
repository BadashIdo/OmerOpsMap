/**
 * LayersControl — floating action button → modal sheet for external layer toggles.
 *
 * Always presents as a single round trigger button (with active-count badge).
 * Clicking opens a centered modal on desktop or a bottom sheet on mobile.
 * Each layer renders as a rich card (icon, name, sub-line, last-sync, switch).
 */

import { useEffect, useState } from "react";
import { EXTERNAL_LAYERS } from "../lib/constants";
import styles from "../styles/LayersControl.module.css";

function relativeTimeHe(date) {
  if (!date) return "—";
  const seconds = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return `לפני ${seconds} שנ׳`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `לפני ${minutes} דק׳`;
  const hours = Math.round(minutes / 60);
  return `לפני ${hours} שע׳`;
}

const LAYER_SUBLINES = {
  oref_alert: "התרעות בזמן אמת — סירנות, רחפנים, חירום",
  tomtom_traffic: "תאונות וחסימות בכבישי גישה לעומר",
  openmeteo_weather: "תחזית נקודתית למרכז עומר",
};

export default function LayersControl({ visibleLayers, onToggle, layerInfo }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === "Escape") setIsOpen(false); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const activeCount = EXTERNAL_LAYERS.filter((l) => visibleLayers?.[l.id]).length;

  return (
    <>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setIsOpen(true)}
        aria-label="פתח לוח שכבות חיצוניות"
        aria-expanded={isOpen}
      >
        <span className={`material-symbols-outlined ${styles.triggerIcon}`}>layers</span>
        {activeCount > 0 && (
          <span className={styles.badge} aria-label={`${activeCount} שכבות פעילות`}>
            <bdi>{activeCount}</bdi>
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className={styles.backdrop}
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div
            className={styles.sheet}
            role="dialog"
            aria-modal="true"
            aria-label="שכבות מפה"
          >
            <div className={styles.handle} aria-hidden="true" />
            <header className={styles.header}>
              <div className={styles.headerText}>
                <h2 className={styles.title}>שכבות חיצוניות</h2>
                <p className={styles.subtitle}>בחר אילו מקורות מידע יוצגו על המפה</p>
              </div>
              <button
                type="button"
                className={styles.closeBtn}
                aria-label="סגור"
                onClick={() => setIsOpen(false)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>

            <ul className={styles.list}>
              {EXTERNAL_LAYERS.map((layer) => {
                const visible = !!visibleLayers?.[layer.id];
                const info = layerInfo?.[layer.id] || {};
                const stale =
                  !!info.error ||
                  (info.lastSyncedAt &&
                    Date.now() - info.lastSyncedAt.getTime() > layer.cadenceSeconds * 5 * 1000);
                const subline = LAYER_SUBLINES[layer.id] || "";
                return (
                  <li key={layer.id} className={styles.row}>
                    <button
                      type="button"
                      className={`${styles.card} ${visible ? styles.cardOn : ""}`}
                      onClick={() => onToggle(layer.id)}
                      aria-pressed={visible}
                    >
                      <span
                        className={styles.iconWrap}
                        style={{ "--card-accent": layer.color }}
                        aria-hidden="true"
                      >
                        <span className={`material-symbols-outlined ${styles.icon}`}>
                          {layer.icon}
                        </span>
                      </span>
                      <div className={styles.cardText}>
                        <span className={styles.cardTitle}>{layer.label_he}</span>
                        <span className={styles.cardSub}>{subline}</span>
                        <span
                          className={`${styles.lastSync} ${stale ? styles.lastSyncStale : ""}`}
                          aria-live="polite"
                        >
                          {info.error
                            ? "תקלה בסנכרון"
                            : <>סונכרן <bdi>{relativeTimeHe(info.lastSyncedAt)}</bdi></>}
                        </span>
                      </div>
                      <span
                        className={`${styles.switch} ${visible ? styles.switchOn : ""}`}
                        aria-hidden="true"
                      >
                        <span className={styles.switchKnob} />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            <footer className={styles.footer}>
              <span>נתונים בזמן אמת:</span>
              <span className={styles.providers}>פיקוד העורף · TomTom · Open-Meteo</span>
            </footer>
          </div>
        </>
      )}
    </>
  );
}
