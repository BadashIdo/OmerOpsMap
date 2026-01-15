import { useState, useMemo } from "react";
import { submitRequest } from "../api/dataService";
import styles from "../styles/RequestForm.module.css";
import SearchableDropdown from "./SearchableDropdown";

// Note: We keep request_type for now for backward compatibility
// In the future, we might remove it completely
const DEFAULT_REQUEST_TYPE = "new_site";

const PRIORITIES = [
  { value: "low", label: "נמוכה", color: "#4CAF50" },
  { value: "medium", label: "בינונית", color: "#FF9800" },
  { value: "high", label: "גבוהה", color: "#FF5722" },
  { value: "critical", label: "קריטית", color: "#F44336" },
];

export default function RequestForm({ isOpen, onClose, location, categoriesStructure = {}, onSuccess }) {
  const [formData, setFormData] = useState({
    request_type: DEFAULT_REQUEST_TYPE,
    is_temporary: true,
    name: "",
    description: "",
    category: "",
    sub_category: "",
    start_date: "",
    end_date: "",
    priority: "medium",
    submitter_name: "",
    submitter_phone: "",
    submitter_email: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error for this field when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
    // Special handling for contact info - clear error if either is filled
    if ((name === 'submitter_phone' || name === 'submitter_email') && errors.contact) {
      setErrors(prev => ({ ...prev, contact: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    const newErrors = {};

    // Validation
    if (!formData.name.trim()) {
      newErrors.name = "נא להזין שם/כותרת";
    }
    if (!formData.category) {
      newErrors.category = "חובה לבחור קטגוריה";
    }
    if (!formData.sub_category) {
      newErrors.sub_category = "חובה לבחור תת-קטגוריה";
    }
    if (!formData.submitter_name.trim()) {
      newErrors.submitter_name = "נא להזין את שמך";
    }
    if (!formData.submitter_phone && !formData.submitter_email) {
      newErrors.contact = "נא להזין טלפון או אימייל ליצירת קשר";
    }
    if (formData.is_temporary && !formData.end_date) {
      newErrors.end_date = "נא להזין תאריך סיום לאירוע זמני";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
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
      setErrors({ general: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      request_type: DEFAULT_REQUEST_TYPE,
      is_temporary: true,
      name: "",
      description: "",
      category: "",
      sub_category: "",
      start_date: "",
      end_date: "",
      priority: "medium",
      submitter_name: "",
      submitter_phone: "",
      submitter_email: "",
    });
    setErrors({});
    setSuccess(false);
    onClose();
  };

  // Get all main categories
  const allCategories = useMemo(() => {
    return Object.keys(categoriesStructure).filter(cat =>
      cat !== "רובעים" && cat !== "אירועים זמניים"
    );
  }, [categoriesStructure]);

  // Get subcategories for selected category, or all if no category selected
  const availableSubCategories = useMemo(() => {
    if (!formData.category) {
      // If no category selected, show all subcategories from all categories
      const allSubs = [];
      Object.entries(categoriesStructure).forEach(([cat, subs]) => {
        if (cat !== "רובעים" && cat !== "אירועים זמניים") {
          if (Array.isArray(subs)) {
            allSubs.push(...subs);
          }
        }
      });
      return [...new Set(allSubs)]; // Remove duplicates
    }

    // If category selected, show only its subcategories
    return categoriesStructure[formData.category] || [];
  }, [formData.category, categoriesStructure]);

  if (!isOpen) return null;

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

        <form id="requestForm" className={styles.form} onSubmit={handleSubmit}>
          {errors.general && <div className={styles.error}>{errors.general}</div>}

          {/* Category - Main Category */}
          <div className={styles.field}>
            <label className={styles.label}>קטגוריה *</label>
            <SearchableDropdown
              options={allCategories}
              value={formData.category}
              onChange={(value) => {
                setFormData(prev => ({ ...prev, category: value, sub_category: "" }));
                // Clear error when selecting
                if (errors.category) {
                  setErrors(prev => ({ ...prev, category: "" }));
                }
              }}
              placeholder="בחר קטגוריה..."
              required
              error={!!errors.category}
            />
            {errors.category && <div className={styles.fieldError} style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>{errors.category}</div>}
          </div>

          {/* Subcategory */}
          <div className={styles.field}>
            <label className={styles.label}>תת-קטגוריה *</label>
            <SearchableDropdown
              options={availableSubCategories}
              value={formData.sub_category}
              onChange={(value) => {
                setFormData(prev => ({ ...prev, sub_category: value }));
                // Clear error when selecting
                if (errors.sub_category) {
                  setErrors(prev => ({ ...prev, sub_category: "" }));
                }
              }}
              placeholder={formData.category ? "בחר תת-קטגוריה..." : "בחר קטגוריה תחילה או בחר מכל התתי-קטגוריות"}
              required
              error={!!errors.sub_category}
            />
            {errors.sub_category && <div className={styles.fieldError} style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>{errors.sub_category}</div>}
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
              className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
            />
            {errors.name && <div className={styles.fieldError} style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>{errors.name}</div>}
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
                  className={`${styles.input} ${errors.end_date ? styles.inputError : ''}`}
                  required
                />
                {errors.end_date && <div className={styles.fieldError} style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>{errors.end_date}</div>}
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
                  className={`${styles.priorityBtn} ${formData.priority === p.value ? styles.selected : ""
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
              className={`${styles.input} ${errors.submitter_name ? styles.inputError : ''}`}
            />
            {errors.submitter_name && <div className={styles.fieldError} style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>{errors.submitter_name}</div>}
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
                className={`${styles.input} ${errors.contact ? styles.inputError : ''}`}
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
                className={`${styles.input} ${errors.contact ? styles.inputError : ''}`}
                dir="ltr"
              />
            </div>
          </div>
          {errors.contact && <div className={styles.fieldError} style={{ color: 'red', fontSize: '12px', marginTop: '4px', textAlign: 'center', width: '100%' }}>{errors.contact}</div>}

          {/* Location Display */}
          <div className={styles.locationBox}>
            <span className={styles.locationIcon}>📍</span>
            <span>
              מיקום נבחר: {location?.lat?.toFixed(5)}, {location?.lng?.toFixed(5)}
            </span>
          </div>
        </form>

        <div className={styles.footer}>
          <button
            type="submit"
            form="requestForm"
            className={styles.submitBtn}
            disabled={isSubmitting}
          >
            {isSubmitting ? "שולח..." : "שלח בקשה 📤"}
          </button>
        </div>
      </div>
    </>
  );
}
