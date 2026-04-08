import { useState } from "react";
import styles from "../../styles/Site.module.css";
import SiteActions from "./SiteActions";

function has(v) {
  return v !== null && v !== undefined && String(v).trim() !== "";
}

export default function SitePopup({ site, isAdmin = false, onEdit }) {
  const [showMore, setShowMore] = useState(false);

  const address =
    has(site.address) ? site.address : [site.street, site.houseNumber].filter(has).join(" ");

  const contactLine = [site.contactName, site.phone].filter(has).join("  ");
  const catLine = [site.category, site.subCategory].filter(has).join(" / ");
  const coordLine =
    has(site.lat) && has(site.lng)
      ? `${Number(site.lat).toFixed(6)}, ${Number(site.lng).toFixed(6)}`
      : "";

  return (
    <div className={styles.popup}>
      {/* כותרת + רובע */}
      <div className={styles.titleRow}>
        <div className={styles.title}>{has(site.name) ? site.name : "אתר"}</div>
        {has(site.district) && <div className={styles.pill}>{site.district}</div>}
      </div>

      {/* טבלת שורות */}
      <div className={styles.rows}>
        {has(site.district) && (
          <div className={styles.row}>
            <span className={styles.label}>רובע</span>
            <span className={styles.value}>{site.district}</span>
          </div>
        )}

        {has(address) && (
          <div className={styles.row}>
            <span className={styles.label}>כתובת</span>
            <span className={styles.value}>{address}</span>
          </div>
        )}

        {has(contactLine) && (
          <div className={styles.row}>
            <span className={styles.label}>איש קשר</span>
            <span className={styles.value}>{contactLine}</span>
          </div>
        )}

        {has(catLine) && (
          <div className={styles.row}>
            <span className={styles.label}>קטגוריה</span>
            <span className={styles.value}>{catLine}</span>
          </div>
        )}

        {has(site.type) && (
          <div className={styles.row}>
            <span className={styles.label}>סוג אתר</span>
            <span className={styles.value}>{site.type}</span>
          </div>
        )}

        {has(coordLine) && (
          <div className={styles.row}>
            <span className={styles.label}>נ.צ</span>
            <span className={styles.value}>{coordLine}</span>
          </div>
        )}
      </div>

      {/* מידע נוסף */}
      {has(site.description) && (
        <>
          <button
            type="button"
            className={styles.smallBtn}
            onClick={() => setShowMore((v) => !v)}
          >
            מידע נוסף
          </button>

          {showMore && <div className={styles.descBox}>{site.description}</div>}
        </>
      )}

      {/* ניווט */}
      <SiteActions lat={site.lat} lng={site.lng} />

      {isAdmin && typeof onEdit === "function" && (
        <button
          type="button"
          className={styles.smallBtn}
          onClick={() => onEdit(site)}
          style={{ marginTop: 8 }}
        >
          ✏️ עריכה
        </button>
      )}
    </div>
  );
}
