import { useMemo, useState } from "react";
import styles from "../styles/SideBar.module.css";
import { getCategoryIcon } from "../lib/categoryIcons";
import { getCategoryConfig } from "../lib/leafletIcons";

export default function SideBar({
  isOpen,
  onClose,
  categoriesStructure,
  activeFilters,
  toggleFilter,
}) {
  // פתוח/סגור לכל קטגוריה (UI בלבד)
  const [openCats, setOpenCats] = useState({});

  // ברירת מחדל: לפתוח את הקטגוריה הראשונה (אפשר לשנות)
  useMemo(() => {
    const keys = Object.keys(categoriesStructure || {});
    if (keys.length && Object.keys(openCats).length === 0) {
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

        {/* Emergency */}
        <div className={styles.emergency}>
          <div className={styles.toggleFake} />
          <div className={styles.emergencyTitle}>מצב חירום</div>
          <div className={styles.emergencyIcon}>⚠️</div>
        </div>

        {/* Exit to selection page */}
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

        {/* Content */}
        <div className={styles.sections}>
          {Object.entries(categoriesStructure).map(([mainCategory, subCategories]) => {
            const isCatOpen = !!openCats[mainCategory];

            return (
              <div key={mainCategory} className={styles.card}>
                {/* לחיצה על הכותרת פותחת/סוגרת */}
                <button
                  type="button"
                  className={styles.cardHeaderBtn}
                  onClick={() => toggleCat(mainCategory)}
                  aria-expanded={isCatOpen}
                >
                  <div className={`${styles.chev} ${isCatOpen ? styles.chevOpen : ""}`}>˅</div>
                  <div className={styles.cardTitle}>{mainCategory}</div>
                  <span className={`material-symbols-outlined ${styles.cardIcon}`}>
                    {getCategoryIcon(mainCategory)}
                  </span>
                </button>

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
      </aside>
    </>
  );
}
