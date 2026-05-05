import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "../styles/SideBar.module.css";
import { getCategoryIcon } from "../lib/categoryIcons";
import { getCategoryConfig } from "../lib/leafletIcons";

// Threshold (px) before we decide it's a vertical swipe and not a tap
const SCROLL_THRESHOLD = 10;

// Speed multiplier for manual scroll (1.0 = same as finger, 0.3 = slow/precise)
const SCROLL_SPEED = 0.7;

export default function SideBar({
  isOpen,
  onClose,
  categoriesStructure,
  activeFilters,
  toggleFilter,
  toggleGroup,
  showTemporarySites,
  setShowTemporarySites,
}) {
  const [openCats, setOpenCats] = useState({});
  const bodyRef = useRef(null);

  useEffect(() => {
    const keys = Object.keys(categoriesStructure || {});
    if (keys.length > 0 && Object.keys(openCats).length === 0) {
      setOpenCats({ [keys[0]]: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoriesStructure]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  /**
   * Manual touch-scroll handler.
   *
   * Problem: when the user presses a <button> or <label> inside .body and
   * swipes vertically, the browser treats it as a tap on the button — not a
   * scroll — so the list never scrolls unless the finger lands in the tiny
   * gap between elements.
   *
   * Solution: attach touchstart / touchmove / touchend listeners directly on
   * the scrollable container with { passive: false } so we can:
   *   1. Detect vertical movement > SCROLL_THRESHOLD → it's a swipe.
   *   2. Manually update scrollTop (same visual result as native scroll).
   *   3. Call e.preventDefault() + e.stopPropagation() to suppress the
   *      synthetic "click" that the browser would have fired on the child.
   */
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;

    let startY = 0;
    let startScrollTop = 0;
    let scrolling = false;

    // --- Momentum scrolling variables ---
    let lastY = 0;
    let lastTime = 0;
    let velocity = 0;
    let animationFrameId = null;

    const onTouchStart = (e) => {
      // Stop any existing momentum scrolling
      if (animationFrameId) cancelAnimationFrame(animationFrameId);

      startY = e.touches[0].clientY;
      lastY = startY;
      lastTime = performance.now();
      velocity = 0;

      startScrollTop = el.scrollTop;
      scrolling = false;
    };

    const onTouchMove = (e) => {
      const currentY = e.touches[0].clientY;
      const currentTime = performance.now();
      const dy = startY - currentY;

      if (!scrolling && Math.abs(dy) > SCROLL_THRESHOLD) {
        scrolling = true;
      }

      if (scrolling) {
        el.scrollTop = startScrollTop + dy * SCROLL_SPEED;

        // Calculate velocity (pixels per ms)
        const dt = currentTime - lastTime;
        if (dt > 0) {
          // Positive velocity = scrolling down (finger moving up)
          velocity = (lastY - currentY) / dt;
        }

        e.preventDefault();      // stops the browser from routing to the child
        e.stopPropagation();
      }

      lastY = currentY;
      lastTime = currentTime;
    };

    const onTouchEnd = (e) => {
      if (scrolling) {
        e.preventDefault();
        e.stopPropagation();
        scrolling = false;

        // --- Start Momentum Scrolling ---
        // Only apply if the touch ended quickly after the last movement
        const timeSinceLastMove = performance.now() - lastTime;
        if (timeSinceLastMove < 50 && Math.abs(velocity) > 0.05) {
          // Amplify the velocity slightly for a better feel, adjusted by SCROLL_SPEED
          let currentVelocity = velocity * 16 * SCROLL_SPEED;
          
          const applyMomentum = () => {
            if (Math.abs(currentVelocity) > 0.5) {
              el.scrollTop += currentVelocity;
              currentVelocity *= 0.92; // Friction (closer to 1 = longer slide)
              animationFrameId = requestAnimationFrame(applyMomentum);
            }
          };
          animationFrameId = requestAnimationFrame(applyMomentum);
        }
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: false });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
    // Re-attach whenever the sidebar opens (bodyRef becomes valid after isOpen→true)
  }, [isOpen]);

  const toggleCat = (cat) =>
    setOpenCats((prev) => ({ ...prev, [cat]: !prev[cat] }));

  if (!isOpen) return null;

  return createPortal(
    <>
      <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />

      <div
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-label="סינון קטגוריות"
        dir="rtl"
      >
        <div className={styles.handle} aria-hidden="true" />

        <header className={styles.header}>
          <div className={styles.headerText}>
            <h2 className={styles.title}>סינון קטגוריות</h2>
            <p className={styles.subtitle}>בחר קטגוריות להצגה על המפה</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="סגור">
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        {/* ── Scrollable body ── ref is used by the touch-scroll handler above */}
        <div
          ref={bodyRef}
          className={styles.body}
          onWheel={(e) => e.stopPropagation()}
        >
          {/* Temporary Sites Toggle */}
          <button
            type="button"
            className={`${styles.card} ${showTemporarySites ? styles.cardOn : ""}`}
            onClick={() => setShowTemporarySites((p) => !p)}
            style={{ "--card-accent": "#f59e0b" }}
          >
            <span className={styles.iconWrap}>
              <span className={styles.iconEmoji}>⚡</span>
            </span>
            <div className={styles.cardText}>
              <span className={styles.cardTitle}>אירועים זמניים</span>
              <span className={styles.cardSub}>
                {showTemporarySites ? "מוצגים על המפה" : "מוסתרים מהמפה"}
              </span>
            </div>
            <span
              className={`${styles.switch} ${showTemporarySites ? styles.switchOn : ""}`}
              aria-hidden="true"
            >
              <span className={styles.switchKnob} />
            </span>
          </button>

          {/* Categories */}
          {Object.entries(categoriesStructure).map(([mainCategory, subCategories]) => {
            const isCatOpen = !!openCats[mainCategory];
            const allOn = subCategories.every((s) => activeFilters.includes(s));

            return (
              <div key={mainCategory} className={styles.accordion}>
                <div className={styles.accordionHeader}>
                  <button
                    type="button"
                    className={styles.accordionBtn}
                    onClick={() => toggleCat(mainCategory)}
                    aria-expanded={isCatOpen}
                  >
                    <span className={`material-symbols-outlined ${styles.accordionIcon}`}>
                      {getCategoryIcon(mainCategory)}
                    </span>
                    <span className={styles.accordionTitle}>{mainCategory}</span>
                    <span className={`material-symbols-outlined ${styles.chev} ${isCatOpen ? styles.chevOpen : ""}`}>
                      expand_more
                    </span>
                  </button>
                  <button
                    type="button"
                    className={styles.toggleAllBtn}
                    onClick={(e) => { e.stopPropagation(); toggleGroup(subCategories); }}
                    title="סמן/בטל הכל"
                  >
                    <span className={`${styles.switch} ${allOn ? styles.switchOn : ""}`} aria-hidden="true">
                      <span className={styles.switchKnob} />
                    </span>
                  </button>
                </div>

                {isCatOpen && (
                  <div className={styles.accordionBody}>
                    {subCategories.map((sub) => {
                      const { color } = getCategoryConfig(sub);
                      const checked = activeFilters.includes(sub);
                      return (
                        <label key={sub} className={styles.checkRow} onClick={() => toggleFilter(sub)}>
                          <span
                            className={styles.dot}
                            style={{ background: color }}
                          />
                          <span className={styles.checkText}>{sub}</span>
                          <span
                            className={`${styles.switch} ${checked ? styles.switchOn : ""}`}
                            style={checked ? { background: color } : {}}
                            aria-hidden="true"
                          >
                            <span className={styles.switchKnob} />
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>,
    document.body
  );
}

