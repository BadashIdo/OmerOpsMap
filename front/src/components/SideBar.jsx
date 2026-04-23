import { useEffect, useState } from "react";
import styles from "../styles/SideBar.module.css";
import { getCategoryIcon } from "../lib/categoryIcons";
import { getCategoryConfig } from "../lib/leafletIcons";

/**
 * SideBar — slide-in panel for filtering map sites by category and district.
 *
 * Renders a collapsible list of main categories, each containing its
 * sub-categories as toggleable checkboxes. The active filter state lives
 * in the parent (MapPage) via useFilters — this component only displays
 * and controls it.
 *
 * Props:
 *  isOpen             — whether the sidebar is currently visible
 *  onClose            — called when the user closes the sidebar
 *  categoriesStructure — { "Main Category" → ["Sub A", …] } from useFilters
 *  activeFilters      — array of currently enabled filter values
 *  toggleFilter       — (item: string) => void
 */
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
  // Per-category accordion open/closed state (UI only, not filter state)
  const [openCats, setOpenCats] = useState({});

  // Open the first category by default when data first loads
  useEffect(() => {
    const keys = Object.keys(categoriesStructure || {});
    if (keys.length > 0 && Object.keys(openCats).length === 0) {
      setOpenCats({ [keys[0]]: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoriesStructure]);

  const toggleCat = (mainCategory) => {
    setOpenCats((prev) => ({ ...prev, [mainCategory]: !prev[mainCategory] }));
  };

  return (
    <>
      <div
        className={`${styles.overlay} ${isOpen ? styles.overlayVisible : ""}`}
        onClick={onClose}
      />

      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ""}`}>
        {/* Header */}
        <div className={styles.top}>
          <div className={styles.brand}>
            <div className={styles.brandTitle}>OmerOpsMap</div>
            <div className={styles.brandSub}>מערכת ניהול עירונית</div>
          </div>

          <button className={styles.closeBtn} onClick={onClose} aria-label="סגור">
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>

        {/* Temporary Sites Toggle */}
        <div className={styles.emergency} onClick={() => setShowTemporarySites(prev => !prev)} style={{ cursor: 'pointer' }}>
          <div className={`${styles.toggleReal} ${showTemporarySites ? styles.toggleOn : styles.toggleOff}`}>
            <div className={styles.toggleThumb} />
          </div>
          <div className={styles.emergencyTitle}>אירועים זמניים</div>
          <div className={styles.emergencyIcon}>⚡</div>
        </div>

        {/* Content */}
        <div className={styles.sections}>
          {Object.entries(categoriesStructure).map(([mainCategory, subCategories]) => {
            const isCatOpen = !!openCats[mainCategory];

            return (
              <div key={mainCategory} className={styles.card}>
                <div
                  className={styles.cardHeaderBtn}
                >
                  <button
                    type="button"
                    className={styles.cardHeaderExpandBtn}
                    onClick={() => toggleCat(mainCategory)}
                    aria-expanded={isCatOpen}
                  >
                    <div className={`${styles.chev} ${isCatOpen ? styles.chevOpen : ""}`}>˅</div>
                    <div className={styles.cardTitle}>{mainCategory}</div>
                    <span className={`material-symbols-outlined ${styles.cardIcon}`}>
                      {getCategoryIcon(mainCategory)}
                    </span>
                  </button>
                  <button
                    type="button"
                    className={styles.cardHeaderToggleAllBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleGroup(subCategories);
                    }}
                    title="סמן/בטל הכל"
                  >
                    <span className="material-symbols-outlined">
                      {subCategories.every(sub => activeFilters.includes(sub)) ? "check_box" : "check_box_outline_blank"}
                    </span>
                  </button>
                </div>

                {/* גוף הקטגוריה נסגר/נפתח */}
                <div className={`${styles.cardBody} ${isCatOpen ? styles.bodyOpen : styles.bodyClosed}`}>
                  {subCategories.map((sub) => {
                    const { color } = getCategoryConfig(sub);
                    return (
                      <label key={sub} className={styles.checkRow}>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <span className={styles.checkText}>{sub}</span>
                          <span
                            style={{
                              width: "8px",
                              height: "8px",
                              backgroundColor: color,
                              borderRadius: "50%",
                              marginRight: "8px",
                              marginLeft: "4px",
                              display: "inline-block",
                            }}
                          />
                        </div>
                        <input
                          type="checkbox"
                          className={styles.checkbox}
                          checked={activeFilters.includes(sub)}
                          onChange={() => toggleFilter(sub)}
                          style={{ accentColor: color }}
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Exit to selection page - moved to bottom */}
        <button
          className={styles.exitBtn}
          onClick={() => {
            if (confirm("האם לצאת ולחזור לבחירת משתמש?\n(אורח / מנהל)")) {
              sessionStorage.clear();
              window.location.reload();
            }
          }}
        >
          <span className={styles.exitIcon}>⎋</span>
          <div className={styles.exitText}>
            <div className={styles.exitTitle}>יציאה</div>
            <div className={styles.exitSub}>שינוי משתמש (אורח/מנהל)</div>
          </div>
        </button>
      </aside>
    </>
  );
}
