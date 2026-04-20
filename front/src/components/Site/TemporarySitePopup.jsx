import { useState } from "react";
import styles from "../../styles/Site.module.css";

function has(v) {
  return v !== null && v !== undefined && String(v).trim() !== "";
}

export default function TemporarySitePopup({ site, isAdmin, onEdit }) {
  const [showMore, setShowMore] = useState(false);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("he-IL", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: "#4CAF50",
      medium: "#FF9800",
      high: "#FF5722",
      critical: "#F44336",
    };
    return colors[priority] || colors.medium;
  };

  const getStatusText = (status) => {
    const statusMap = {
      active: "פעיל",
      paused: "מושהה",
      resolved: "טופל",
    };
    return statusMap[status] || status;
  };

  const contactLine = [site.contact_name, site.phone].filter(has).join("  ");
  const coordLine =
    has(site.lat) && has(site.lng)
      ? `${Number(site.lat).toFixed(6)}, ${Number(site.lng).toFixed(6)}`
      : "";

  return (
    <div className={styles.popup}>
      {/* כותרת + תגית זמני */}
      <div className={styles.titleRow}>
        <div className={styles.title}>
          {has(site.name) ? site.name : "אירוע זמני"}
        </div>
        <div
          className={styles.pill}
          style={{
            backgroundColor: getPriorityColor(site.priority),
            color: "white",
          }}
        >
          ⚡ {site.priority}
        </div>
      </div>

      {/* טבלת שורות */}
      <div className={styles.rows}>
        {has(site.category) && (
          <div className={styles.row}>
            <span className={styles.label}>סוג</span>
            <span className={styles.value}>{site.category}</span>
          </div>
        )}

        {has(site.status) && (
          <div className={styles.row}>
            <span className={styles.label}>סטטוס</span>
            <span className={styles.value}>{getStatusText(site.status)}</span>
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

        {has(contactLine) && (
          <div className={styles.row}>
            <span className={styles.label}>איש קשר</span>
            <span className={styles.value}>{contactLine}</span>
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
            פרטים נוספים
          </button>

          {showMore && <div className={styles.descBox}>{site.description}</div>}
        </>
      )}
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

