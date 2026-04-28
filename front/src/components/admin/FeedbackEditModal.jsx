import { useState } from "react";
import { updateFeedback, createFeedbackAsAdmin } from "../../api/feedbackApi";
import styles from "../../styles/FeedbackEditModal.module.css";

const TOPICS = [
  { value: "bug", label: "דיווח על תקלה" },
  { value: "suggestion", label: "הצעת שיפור" },
  { value: "map_data", label: "בעיה במידע במפה" },
  { value: "general", label: "כללי" },
  { value: "other", label: "אחר" },
];

const STATUSES = [
  { value: "new", label: "חדש" },
  { value: "in_progress", label: "בטיפול" },
  { value: "resolved", label: "טופל" },
];

export default function FeedbackEditModal({ feedback, mode, authHeader, onClose, onSaved, onSwitchToEdit }) {
  const isCreate = mode === "create";
  const isView = mode === "view";
  const readOnly = isView;

  // Initial state derived from props at mount time. The parent uses a `key`
  // to remount this component when switching to a different feedback entry.
  const [name, setName] = useState(feedback?.name || "");
  const [topic, setTopic] = useState(feedback?.topic || "bug");
  const [contact, setContact] = useState(feedback?.contact || "");
  const [description, setDescription] = useState(feedback?.description || "");
  const [status, setStatus] = useState(feedback?.status || "new");
  const [adminNotes, setAdminNotes] = useState(feedback?.admin_notes || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !topic || !description.trim()) return;

    setSaving(true);
    setError("");
    try {
      const payload = {
        name: name.trim(),
        topic,
        contact: contact.trim() || null,
        description: description.trim(),
        status,
        admin_notes: adminNotes.trim() || null,
      };
      if (isCreate) {
        await createFeedbackAsAdmin(payload, authHeader);
      } else {
        await updateFeedback(feedback.id, payload, authHeader);
      }
      onSaved?.();
    } catch (err) {
      setError(err.message || "שגיאה בשמירת המשוב");
      setSaving(false);
    }
  };

  const titleByMode = {
    view: "פרטי המשוב",
    edit: "עריכת משוב",
    create: "הוספת משוב חדש",
  };

  return (
    <>
      <div className={styles.overlay} onClick={saving ? undefined : onClose} />
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>{titleByMode[mode] || "משוב"}</h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            disabled={saving}
            aria-label="סגור"
          >×</button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span className={styles.labelText}>שם מלא <span className={styles.required}>*</span></span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              required
              disabled={readOnly || saving}
              className={styles.input}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.labelText}>נושא <span className={styles.required}>*</span></span>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              required
              disabled={readOnly || saving}
              className={styles.input}
            >
              {TOPICS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span className={styles.labelText}>טלפון או אימייל</span>
            <input
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              maxLength={255}
              disabled={readOnly || saving}
              className={styles.input}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.labelText}>תיאור <span className={styles.required}>*</span></span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              required
              disabled={readOnly || saving}
              className={styles.textarea}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.labelText}>סטטוס</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={readOnly || saving}
              className={styles.input}
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span className={styles.labelText}>הערות פנימיות</span>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={3}
              disabled={readOnly || saving}
              className={styles.textarea}
              placeholder="הערות שרק מנהלים רואים"
            />
          </label>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.footer}>
            {isView ? (
              <>
                <button type="button" className={styles.cancelBtn} onClick={onClose}>סגור</button>
                <button type="button" className={styles.primaryBtn} onClick={onSwitchToEdit}>ערוך</button>
              </>
            ) : (
              <>
                <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={saving}>ביטול</button>
                <button type="submit" className={styles.primaryBtn} disabled={saving}>
                  {saving ? "שומר..." : (isCreate ? "הוסף" : "שמור")}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </>
  );
}
