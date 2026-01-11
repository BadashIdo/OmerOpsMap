import styles from "../styles/TemporaryEventsPanel.module.css";
/**
 * Panel showing list of all temporary events
 */
export default function TemporaryEventsPanel({ isOpen, onClose, events, onEventClick }) {
  if (!isOpen) return null;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("he-IL", {
      day: "numeric",
      month: "short",
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

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.panel}>
        <div className={styles.header}>
          <h2 className={styles.title}>⚡ אירועים זמניים</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.content}>
          {events.length === 0 ? (
            <div className={styles.empty}>אין אירועים זמניים פעילים</div>
          ) : (
            <div className={styles.eventsList}>
              {events.map((event) => (
                <div
                  key={event.id}
                  className={styles.eventCard}
                  onClick={() => {
                    onEventClick(event);
                    onClose();
                  }}
                >
                  <div className={styles.eventHeader}>
                    <div className={styles.eventIcon}>
                      {getCategoryEmoji(event.category)}
                    </div>
                    <div className={styles.eventTitle}>{event.name}</div>
                    <div
                      className={styles.priorityBadge}
                      style={{ backgroundColor: getPriorityColor(event.priority) }}
                    >
                      {event.priority}
                    </div>
                  </div>

                  {event.description && (
                    <div className={styles.eventDescription}>{event.description}</div>
                  )}

                  <div className={styles.eventDetails}>
                    {event.category && (
                      <div className={styles.detail}>
                        <span className={styles.label}>קטגוריה:</span>
                        <span className={styles.value}>{event.category}</span>
                      </div>
                    )}
                    <div className={styles.detail}>
                      <span className={styles.label}>סיום:</span>
                      <span className={styles.value}>{formatDate(event.end_date)}</span>
                    </div>
                    {event.contact_name && (
                      <div className={styles.detail}>
                        <span className={styles.label}>איש קשר:</span>
                        <span className={styles.value}>{event.contact_name}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <div className={styles.count}>
            סה"כ {events.length} אירוע{events.length !== 1 ? "ים" : ""} פעיל
            {events.length !== 1 ? "ים" : ""}
          </div>
        </div>
      </div>
    </>
  );
}

