import { useMemo, useState } from "react";
import styles from "../styles/SideBar.module.css";

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
          <div className={styles.langPill}>EN ⇄ ע</div>

          <div className={styles.brand}>
            <div className={styles.brandTitle}>OmerOpsMap</div>
            <div className={styles.brandSub}>מערכת ניהול עירונית</div>
          </div>

          <button className={styles.closeBtn} onClick={onClose} aria-label="סגור">
            ✕
          </button>
        </div>

        {/* Emergency */}
        <div className={styles.emergency}>
          <div className={styles.toggleFake} />
          <div className={styles.emergencyTitle}>מצב חירום</div>
          <div className={styles.emergencyIcon}>⚠️</div>
        </div>

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
                  <div className={styles.cardIcon}>🔧</div>
                </button>

                {/* גוף הקטגוריה נסגר/נפתח */}
                <div className={`${styles.cardBody} ${isCatOpen ? styles.bodyOpen : styles.bodyClosed}`}>
                  {subCategories.map((sub) => (
                    <label key={sub} className={styles.checkRow}>
                      <span className={styles.checkText}>{sub}</span>
                      <input
                        type="checkbox"
                        className={styles.checkbox}
                        checked={activeFilters.includes(sub)}
                        onChange={() => toggleFilter(sub)}
                      />
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className={styles.footer}>Omer Municipality 2024 ©</div>
      </aside>
    </>
  );
}
