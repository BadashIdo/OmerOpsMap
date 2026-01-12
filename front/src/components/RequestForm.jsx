import { useState } from "react";
import { submitRequest } from "../api/dataService";
import styles from "../styles/RequestForm.module.css";

const REQUEST_TYPES = [
  { value: "hazard", label: "מפגע / סכנה", icon: "⚠️" },
  { value: "roadwork", label: "עבודות / חסימה", icon: "🚧" },
  { value: "event", label: "אירוע ציבורי", icon: "🎉" },
  { value: "new_site", label: "אתר חדש", icon: "📍" },
  { value: "correction", label: "תיקון לאתר קיים", icon: "✏️" },
  { value: "other", label: "אחר", icon: "📝" },
];

const CATEGORIES = [
  "חינוך",
  "בריאות",
  "ספורט",
  "תרבות",
  "מסחר",
  "דת",
  "שירותים עירוניים",
  "תחבורה",
  "פנאי",
  "אחר",
];

const PRIORITIES = [
  { value: "low", label: "נמוכה", color: "#4CAF50" },
  { value: "medium", label: "בינונית", color: "#FF9800" },
  { value: "high", label: "גבוהה", color: "#FF5722" },
  { value: "critical", label: "קריטית", color: "#F44336" },
];

export default function RequestForm({ isOpen, onClose, location, onSuccess }) {
  const [formData, setFormData] = useState({
    request_type: "hazard",
    is_temporary: true,
    name: "",
    description: "",
    category: "",
    start_date: "",
    end_date: "",
    priority: "medium",
    submitter_name: "",
    submitter_phone: "",
    submitter_email: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.name.trim()) {
      setError("נא להזין שם/כותרת");
      return;
    }
    if (!formData.submitter_name.trim()) {
      setError("נא להזין את שמך");
      return;
    }
    if (!formData.submitter_phone && !formData.submitter_email) {
      setError("נא להזין טלפון או אימייל ליצירת קשר");
      return;
    }
    if (formData.is_temporary && !formData.end_date) {
      setError("נא להזין תאריך סיום לאירוע זמני");
      return;
    }

    setIsSubmitting(true);

    try {
      const requestData = {
        ...formData,
        lat: location.lat,
        lng: location.lng,
        start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null,
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
      };

      await submitRequest(requestData);
      setSuccess(true);
      
      if (onSuccess) {
        onSuccess();
      }

      // Close after showing success message
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      request_type: "hazard",
      is_temporary: true,
      name: "",
      description: "",
      category: "",
      start_date: "",
      end_date: "",
      priority: "medium",
      submitter_name: "",
      submitter_phone: "",
      submitter_email: "",
    });
    setError("");
    setSuccess(false);
    onClose();
  };

  if (success) {
    return (
      <>
        <div className={styles.overlay} onClick={handleClose} />
        <div className={styles.modal}>
          <div className={styles.successMessage}>
            <div className={styles.successIcon}>✅</div>
            <h2>הבקשה נשלחה בהצלחה!</h2>
            <p>הבקשה שלך תיבדק על ידי המנהלים ותקבל עדכון בקרוב.</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className={styles.overlay} onClick={handleClose} />
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>📍 הוספת בקשה חדשה</h2>
          <button className={styles.closeBtn} onClick={handleClose}>
            ×
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <div className={styles.error}>{error}</div>}

          {/* Request Type */}
          <div className={styles.field}>
            <label className={styles.label}>סוג הבקשה</label>
            <div className={styles.typeGrid}>
              {REQUEST_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  className={`${styles.typeBtn} ${
                    formData.request_type === type.value ? styles.selected : ""
                  }`}
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, request_type: type.value }))
                  }
                >
                  <span className={styles.typeIcon}>{type.icon}</span>
                  <span className={styles.typeLabel}>{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Is Temporary */}
          <div className={styles.checkboxField}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="is_temporary"
                checked={formData.is_temporary}
                onChange={handleChange}
              />
              <span>אירוע זמני (עם תאריך סיום)</span>
            </label>
          </div>

          {/* Name */}
          <div className={styles.field}>
            <label className={styles.label}>שם / כותרת *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="לדוגמה: בור בכביש ברחוב הדקל"
              className={styles.input}
            />
          </div>

          {/* Description */}
          <div className={styles.field}>
            <label className={styles.label}>תיאור</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="פרטים נוספים..."
              className={styles.textarea}
              rows={3}
            />
          </div>

          {/* Category */}
          <div className={styles.field}>
            <label className={styles.label}>קטגוריה</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={styles.select}
            >
              <option value="">בחר קטגוריה</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Dates for temporary */}
          {formData.is_temporary && (
            <div className={styles.dateRow}>
              <div className={styles.field}>
                <label className={styles.label}>תאריך התחלה</label>
                <input
                  type="datetime-local"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  className={styles.input}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>תאריך סיום *</label>
                <input
                  type="datetime-local"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  className={styles.input}
                  required
                />
              </div>
            </div>
          )}

          {/* Priority */}
          <div className={styles.field}>
            <label className={styles.label}>דחיפות</label>
            <div className={styles.priorityRow}>
              {PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  className={`${styles.priorityBtn} ${
                    formData.priority === p.value ? styles.selected : ""
                  }`}
                  style={{
                    borderColor: formData.priority === p.value ? p.color : "#e0e0e0",
                    backgroundColor:
                      formData.priority === p.value ? p.color + "20" : "white",
                  }}
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, priority: p.value }))
                  }
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.divider}>
            <span>פרטי המדווח</span>
          </div>

          {/* Submitter Name */}
          <div className={styles.field}>
            <label className={styles.label}>שם מלא *</label>
            <input
              type="text"
              name="submitter_name"
              value={formData.submitter_name}
              onChange={handleChange}
              placeholder="השם שלך"
              className={styles.input}
            />
          </div>

          {/* Contact Info */}
          <div className={styles.contactRow}>
            <div className={styles.field}>
              <label className={styles.label}>טלפון</label>
              <input
                type="tel"
                name="submitter_phone"
                value={formData.submitter_phone}
                onChange={handleChange}
                placeholder="050-1234567"
                className={styles.input}
                dir="ltr"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>אימייל</label>
              <input
                type="email"
                name="submitter_email"
                value={formData.submitter_email}
                onChange={handleChange}
                placeholder="email@example.com"
                className={styles.input}
                dir="ltr"
              />
            </div>
          </div>

          {/* Location Display */}
          <div className={styles.locationBox}>
            <span className={styles.locationIcon}>📍</span>
            <span>
              מיקום נבחר: {location?.lat?.toFixed(5)}, {location?.lng?.toFixed(5)}
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={isSubmitting}
          >
            {isSubmitting ? "שולח..." : "שלח בקשה 📤"}
          </button>
        </form>
      </div>
    </>
  );
}

