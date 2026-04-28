/**
 * LayersControl — floating toggle panel for external data layers.
 *
 * Desktop: fixed right-side panel (collapsible).
 * Mobile (<768 px): a single trigger button that opens a bottom sheet.
 *
 * Accessibility: each layer toggle is a button with aria-pressed, last-sync
 * info is announced as polite. Hebrew RTL with logical properties only.
 */

import { useEffect, useState } from "react";
import { EXTERNAL_LAYERS } from "../lib/constants";
import styles from "../styles/LayersControl.module.css";

function relativeTimeHe(date) {
  if (!date) return "—";
  const seconds = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return `לפני ${seconds} ש׳`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `לפני ${minutes} ד׳`;
  const hours = Math.round(minutes / 60);
  return `לפני ${hours} ש׳ש׳`;
}

export default function LayersControl({
  visibleLayers,
  onToggle,
  layerInfo, // { [source]: { lastSyncedAt, count, error } }
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Desktop: panel is always open.
  // Mobile: open via the trigger button → renders as a bottom sheet.
  const panelOpen = !isMobile || isOpen;

  return (
    <>
      {isMobile && (
        <button
          type="button"
          className={styles.trigger}
          onClick={() => setIsOpen(true)}
          aria-label="פתח לוח שכבות"
        >
          <span className="material-symbols-outlined">layers</span>
          <span className={styles.triggerLabel}>שכבות</span>
        </button>
      )}

      {panelOpen && (
        <div
          className={`${styles.panel} ${isMobile ? styles.panelMobile : styles.panelDesktop}`}
          role="dialog"
          aria-label="שכבות מפה"
        >
          <div className={styles.header}>
            <span className={styles.title}>שכבות חיצוניות</span>
            {isMobile && (
              <button
                type="button"
                className={styles.close}
                aria-label="סגור"
                onClick={() => setIsOpen(false)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            )}
          </div>

          <ul className={styles.list}>
            {EXTERNAL_LAYERS.map((layer) => {
              const visible = !!visibleLayers?.[layer.id];
              const info = layerInfo?.[layer.id] || {};
              const stale = info.error || (info.lastSyncedAt &&
                Date.now() - info.lastSyncedAt.getTime() > layer.cadenceSeconds * 5 * 1000);

              return (
                <li key={layer.id} className={styles.row}>
                  <button
                    type="button"
                    className={`${styles.toggle} ${visible ? styles.toggleOn : ""}`}
                    aria-pressed={visible}
                    onClick={() => onToggle(layer.id)}
                  >
                    <span
                      className={`material-symbols-outlined ${styles.icon}`}
                      style={{ color: layer.color }}
                    >
                      {layer.icon}
                    </span>
                    <span className={styles.label}>{layer.label_he}</span>
                    <span
                      className={`${styles.lastSync} ${stale ? styles.lastSyncStale : ""}`}
                      aria-live="polite"
                    >
                      <bdi>{relativeTimeHe(info.lastSyncedAt)}</bdi>
                    </span>
                    <span className={styles.checkmark}>
                      {visible ? "✓" : ""}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className={styles.footer}>
            <span className={styles.poweredBy}>נתונים: TomTom · OpenMeteo · פיקוד העורף</span>
          </div>
        </div>
      )}

      {isMobile && panelOpen && (
        <div
          className={styles.backdrop}
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}
