import { useState } from "react";
import styles from "../../styles/Site.module.css";
import SiteActions from "./SiteActions";
import { has } from "../../lib/siteUtils";

export default function TemporarySitePopup({ site, isAdmin, onEdit }) {
  const [showMore, setShowMore] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("he-IL", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const address =
    has(site.address) ? site.address : [site.street, site.house_number || site.houseNumber].filter(has).join(" ");

  const contactLine = [site.contact_name || site.contactName, site.phone].filter(has).join("  ");
  const catLine = [site.category, site.sub_category || site.subCategory].filter(has).join(" / ");
  const coordLine =
    has(site.lat) && has(site.lng)
      ? `${Number(site.lat).toFixed(6)}, ${Number(site.lng).toFixed(6)}`
      : "";

  return (
    <div className={styles.popup}>
      {/* כותרת + רובע */}
      <div className={styles.titleRow}>
        <div className={styles.title}>{has(site.name) ? site.name : "אירוע זמני"}</div>
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

        {has(site.start_date) && (
          <div className={styles.row}>
            <span className={styles.label}>התחלה</span>
            <span className={styles.value}>{formatDate(site.start_date)}</span>
          </div>
        )}

        {has(site.end_date) && (
          <div className={styles.row}>
            <span className={styles.label}>סיום</span>
            <span className={styles.value}>{formatDate(site.end_date)}</span>
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

      {/* פעולות מנהל */}
      {isAdmin && (
        <button
          type="button"
          className={styles.smallBtn}
          onClick={() => onEdit?.(site)}
          style={{
            marginTop: 12,
            background: "#ff9800",
            color: "white",
            borderColor: "#ff9800",
            fontWeight: "bold",
          }}
        >
          ✏️ ערוך אירוע
        </button>
      )}
    </div>
  );
}

