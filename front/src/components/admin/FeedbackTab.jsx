import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { listFeedback, deleteFeedback, updateFeedback } from "../../api/feedbackApi";
import FeedbackEditModal from "./FeedbackEditModal";
import styles from "../../styles/FeedbackTab.module.css";

const TOPICS = [
  { value: "bug", label: "דיווח על תקלה" },
  { value: "suggestion", label: "הצעת שיפור" },
  { value: "map_data", label: "בעיה במידע במפה" },
  { value: "general", label: "כללי" },
  { value: "other", label: "אחר" },
];

const STATUSES = [
  { value: "new", label: "חדש", className: "statusNew" },
  { value: "in_progress", label: "בטיפול", className: "statusInProgress" },
  { value: "resolved", label: "טופל", className: "statusResolved" },
];

const TOPIC_BY_VALUE = Object.fromEntries(TOPICS.map((t) => [t.value, t.label]));
const STATUS_BY_VALUE = Object.fromEntries(STATUSES.map((s) => [s.value, s]));

// Sort priority: new on top, then in_progress, then resolved at the bottom.
const STATUS_ORDER = { new: 0, in_progress: 1, resolved: 2 };

function formatDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("he-IL", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export default function FeedbackTab({ authHeader, refreshTrigger, onCountChange }) {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [topicFilter, setTopicFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [editing, setEditing] = useState(null);
  const [editMode, setEditMode] = useState("view");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Stable refs so load() doesn't churn on every parent render (authHeader is rebuilt each call).
  const authHeaderRef = useRef(authHeader);
  useEffect(() => { authHeaderRef.current = authHeader; }, [authHeader]);
  const onCountChangeRef = useRef(onCountChange);
  useEffect(() => { onCountChangeRef.current = onCountChange; }, [onCountChange]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await listFeedback(authHeaderRef.current);
      setItems(data);
      const newCount = data.filter((d) => d.status === "new").length;
      onCountChangeRef.current?.(newCount);
    } catch (err) {
      setError(err.message || "שגיאה בטעינת המשובים");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshTrigger]);

  const filteredItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return items
      .filter((fb) => {
        if (statusFilter && fb.status !== statusFilter) return false;
        if (topicFilter && fb.topic !== topicFilter) return false;
        if (term) {
          const hay = `${fb.name || ""} ${fb.description || ""}`.toLowerCase();
          if (!hay.includes(term)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const sa = STATUS_ORDER[a.status] ?? 99;
        const sb = STATUS_ORDER[b.status] ?? 99;
        if (sa !== sb) return sa - sb;
        // Same status group: newest first
        return new Date(b.created_at) - new Date(a.created_at);
      });
  }, [items, searchTerm, topicFilter, statusFilter]);

  const handleDelete = async (id) => {
    try {
      await deleteFeedback(id, authHeaderRef.current);
      setConfirmDeleteId(null);
      load();
    } catch (err) {
      alert(err.message || "שגיאה במחיקת המשוב");
    }
  };

  const handleSaved = () => {
    setEditing(null);
    setEditMode("view");
    load();
  };

  // Optimistic inline status change directly from the card.
  const handleStatusChange = async (fb, newStatus) => {
    if (newStatus === fb.status) return;
    // Optimistically update local list so the card moves immediately.
    setItems((prev) => prev.map((x) => (x.id === fb.id ? { ...x, status: newStatus } : x)));
    try {
      await updateFeedback(fb.id, { status: newStatus }, authHeaderRef.current);
      load();
    } catch (err) {
      alert(err.message || "שגיאה בעדכון הסטטוס");
      load(); // revert from server state
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <h3 className={styles.title}>
          משובים ({filteredItems.length}
          {filteredItems.length !== items.length ? ` מתוך ${items.length}` : ""})
        </h3>
        <button
          className={styles.addBtn}
          onClick={() => { setEditing({}); setEditMode("create"); }}
        >
          ➕ הוסף משוב
        </button>
      </div>

      <div className={styles.toolbar}>
        <input
          type="text"
          placeholder="חפש לפי שם או תוכן..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
        <select
          value={topicFilter}
          onChange={(e) => setTopicFilter(e.target.value)}
          className={styles.filter}
        >
          <option value="">כל הנושאים</option>
          {TOPICS.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={styles.filter}
        >
          <option value="">כל הסטטוסים</option>
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <button className={styles.refreshBtn} onClick={load} title="רענן">🔄</button>
      </div>

      {isLoading ? (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <span>טוען משובים...</span>
        </div>
      ) : error ? (
        <div className={styles.errorBox}>{error}</div>
      ) : filteredItems.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>💬</div>
          <h3>{items.length === 0 ? "אין משובים" : "לא נמצאו משובים"}</h3>
          <p>{searchTerm || topicFilter || statusFilter ? "נסו לשנות את הסינון" : "כשיגיעו משובים הם יוצגו כאן"}</p>
        </div>
      ) : (
        <div className={styles.list}>
          {filteredItems.map((fb) => {
            const status = STATUS_BY_VALUE[fb.status] || { label: fb.status, className: "" };
            const isResolved = fb.status === "resolved";
            return (
              <div
                key={fb.id}
                className={`${styles.card} ${isResolved ? styles.cardResolved : ""}`}
              >
                <div className={styles.cardHead}>
                  <div className={styles.cardName}>{fb.name}</div>
                  <select
                    value={fb.status}
                    onChange={(e) => handleStatusChange(fb, e.target.value)}
                    className={`${styles.statusSelect} ${styles[status.className]}`}
                    aria-label="שינוי סטטוס"
                    title="שינוי סטטוס"
                  >
                    {STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.cardMeta}>
                  <span className={styles.topicBadge}>{TOPIC_BY_VALUE[fb.topic] || fb.topic}</span>
                  <span className={styles.date}>{formatDate(fb.created_at)}</span>
                  {fb.contact && <span className={styles.contact}>📞 {fb.contact}</span>}
                </div>
                <div className={styles.cardBody}>{fb.description}</div>
                <div className={styles.actions}>
                  <button
                    className={styles.viewBtn}
                    onClick={() => { setEditing(fb); setEditMode("view"); }}
                  >👁 צפה</button>
                  <button
                    className={styles.editBtn}
                    onClick={() => { setEditing(fb); setEditMode("edit"); }}
                  >✏️ ערוך</button>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => setConfirmDeleteId(fb.id)}
                  >🗑️ מחק</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <FeedbackEditModal
          key={editMode === "create" ? "new" : `fb-${editing.id}`}
          feedback={editMode === "create" ? null : editing}
          mode={editMode}
          authHeader={authHeader}
          onClose={() => { setEditing(null); setEditMode("view"); }}
          onSaved={handleSaved}
          onSwitchToEdit={() => setEditMode("edit")}
        />
      )}

      {confirmDeleteId !== null && (
        <div className={styles.confirmOverlay} onClick={() => setConfirmDeleteId(null)}>
          <div className={styles.confirmBox} onClick={(e) => e.stopPropagation()}>
            <h4>למחוק את המשוב?</h4>
            <p>פעולה זו אינה ניתנת לביטול.</p>
            <div className={styles.confirmActions}>
              <button className={styles.cancelBtn} onClick={() => setConfirmDeleteId(null)}>ביטול</button>
              <button className={styles.confirmDeleteBtn} onClick={() => handleDelete(confirmDeleteId)}>מחק</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
