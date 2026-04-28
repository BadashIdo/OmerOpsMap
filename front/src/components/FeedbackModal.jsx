import { useState } from "react";
import { submitFeedback } from "../api/feedbackApi";
import styles from "../styles/FeedbackModal.module.css";

const TOPICS = [
  { value: "bug", label: "דיווח על תקלה" },
  { value: "suggestion", label: "הצעת שיפור" },
  { value: "map_data", label: "בעיה במידע במפה" },
  { value: "general", label: "כללי" },
  { value: "other", label: "אחר" },
];

export default function FeedbackModal({ onClose }) {
  const [name, setName] = useState("");
  const [topic, setTopic] = useState("");
  const [contact, setContact] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !topic || !description.trim()) return;

    setSubmitting(true);
    setError("");
    try {
      await submitFeedback({
        name: name.trim(),
        topic,
        contact: contact.trim() || null,
        description: description.trim(),
      });
      setSubmitted(true);
      setTimeout(() => onClose?.(), 2000);
    } catch (err) {
      setError(err.message || "שגיאה בשליחת המשוב");
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className={styles.overlay} onClick={submitting ? undefined : onClose} />
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>שלח לנו משוב</h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            disabled={submitting}
            aria-label="סגור"
          >
            ×
          </button>
        </div>

        {submitted ? (
          <div className={styles.success}>
            <div className={styles.successIcon}>✓</div>
            <h3>תודה!</h3>
            <p>המשוב התקבל בהצלחה</p>
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            <label className={styles.field}>
              <span className={styles.labelText}>
                שם מלא <span className={styles.required}>*</span>
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                required
                disabled={submitting}
                className={styles.input}
              />
            </label>

            <label className={styles.field}>
              <span className={styles.labelText}>
                נושא המשוב <span className={styles.required}>*</span>
              </span>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                required
                disabled={submitting}
                className={styles.input}
              >
                <option value="">בחרו...</option>
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
                disabled={submitting}
                className={styles.input}
                placeholder="לא חובה"
              />
              <span className={styles.hint}>השאירו טלפון או אימייל כדי שנוכל לחזור אליכם</span>
            </label>

            <label className={styles.field}>
              <span className={styles.labelText}>
                תיאור המשוב <span className={styles.required}>*</span>
              </span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                required
                disabled={submitting}
                className={styles.textarea}
                placeholder="ספרו לנו במה מדובר..."
              />
            </label>

            {error && <div className={styles.error}>{error}</div>}

            <button type="submit" disabled={submitting} className={styles.submitBtn}>
              {submitting ? "שולח..." : "שלח משוב"}
            </button>
          </form>
        )}
      </div>
    </>
  );
}
