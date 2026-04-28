import { useState, useRef } from "react";
import { submitFeedback } from "../api/feedbackApi";
import LocationPickerMap from "./admin/LocationPickerMap";
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
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);


  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

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
        lat: lat !== "" ? parseFloat(lat) : null,
        lng: lng !== "" ? parseFloat(lng) : null,
        photo,
      });
      setSubmitted(true);
      setTimeout(() => onClose?.(), 2000);
    } catch (err) {
      setError(err.message || "שגיאה בשליחת המשוב");
      setSubmitting(false);
    }
  };

  if (showLocationPicker) {
    return (
      <LocationPickerMap
        initialLat={lat !== "" ? parseFloat(lat) : 31.2632}
        initialLng={lng !== "" ? parseFloat(lng) : 34.8419}
        onConfirm={({ lat: pickedLat, lng: pickedLng }) => {
          setLat(pickedLat.toFixed(6));
          setLng(pickedLng.toFixed(6));
          setShowLocationPicker(false);
        }}
        onCancel={() => setShowLocationPicker(false)}
      />
    );
  }

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
                rows={4}
                required
                disabled={submitting}
                className={styles.textarea}
                placeholder="ספרו לנו במה מדובר..."
              />
            </label>

            {/* Location */}
            <div className={styles.field}>
              <span className={styles.labelText}>מיקום (לא חובה)</span>
              <div className={styles.locationRow}>
                <input
                  type="number"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  placeholder="קו רוחב"
                  step="0.000001"
                  disabled={submitting}
                  className={styles.input}
                  dir="ltr"
                />
                <input
                  type="number"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  placeholder="קו אורך"
                  step="0.000001"
                  disabled={submitting}
                  className={styles.input}
                  dir="ltr"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowLocationPicker(true)}
                disabled={submitting}
                className={styles.locationBtn}
              >
                📍 בחר מיקום על המפה
              </button>
              {lat && lng && (
                <span className={styles.hint}>
                  {parseFloat(lat).toFixed(5)}, {parseFloat(lng).toFixed(5)}
                  {" "}
                  <button
                    type="button"
                    onClick={() => { setLat(""); setLng(""); }}
                    style={{ background: "none", border: "none", color: "#d32f2f", cursor: "pointer", padding: 0, fontSize: 13 }}
                  >✕ נקה</button>
                </span>
              )}
            </div>

            {/* Photo */}
            <div className={styles.field}>
              <span className={styles.labelText}>תמונה (לא חובה)</span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={submitting}
                className={styles.locationBtn}
              >
                📷 {photo ? "החלף תמונה" : "העלה תמונה"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handlePhotoChange}
              />
              {photoPreview && (
                <div className={styles.photoPreview}>
                  <img src={photoPreview} alt="תצוגה מקדימה" />
                  <button
                    type="button"
                    onClick={() => { setPhoto(null); setPhotoPreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                    className={styles.removePhoto}
                  >✕</button>
                </div>
              )}
            </div>

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
