import { useState, useMemo, useRef, useEffect } from "react";
import {
  createPermanentSiteAuth,
  updatePermanentSiteAuth,
  createTemporarySiteAuth,
  updateTemporarySiteAuth,
  deletePermanentSiteAuth,
  deleteTemporarySiteAuth,
} from "../../api/sitesApi";
import LocationPickerMap from "./LocationPickerMap";
import { DISTRICTS } from "../../lib/constants";
import styles from "../../styles/SiteEditModal.module.css";

// Excluded top-level keys that are not real site categories
const EXCLUDED_STRUCTURE_KEYS = ["רובעים", "אירועים זמניים"];

// Helper: split an ISO / datetime-local string into { date, hour, minute } parts
function splitDateTime(raw) {
  if (!raw) return { date: "", hour: "", minute: "" };
  const [date, time = ""] = raw.substring(0, 16).split("T");
  const [h = "", m = ""] = time.split(":");
  return { date, hour: h.substring(0, 2), minute: m.substring(0, 2) };
}

// Helper: combine date + hour + minute into a datetime-local value
function combineDateTime(date, hour, minute) {
  if (!date) return "";
  const h = hour || "00";
  const m = minute || "00";
  return `${date}T${h}:${m}`;
}

// Hour options 00–23
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));

// Minute options in 5-minute steps
const MINUTE_OPTIONS = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

export default function SiteEditModal({ site, siteType, authHeader, categoriesStructure, onClose, onSave }) {
  const isNew = !site?.id;

  const getInitialFormData = (type) => {
    if (type === "permanent") {
      return {
        name: site?.name || "",
        category: site?.category || "",
        sub_category: site?.subCategory || site?.sub_category || "",
        type: site?.type || "",
        district: site?.district || "",
        street: site?.street || "",
        house_number: site?.houseNumber || site?.house_number || "",
        description: site?.description || "",
        lat: site?.lat || 31.25,
        lng: site?.lng || 34.79,
        phone: site?.phone || "",
        contact_name: site?.contactName || site?.contact_name || "",
      };
    } else {
      const startParts = splitDateTime(site?.start_date);
      const endParts   = splitDateTime(site?.end_date);
      return {
        name: site?.name || "",
        category: site?.category || "",
        sub_category: site?.subCategory || site?.sub_category || "",
        type: site?.type || "",
        district: site?.district || "",
        street: site?.street || "",
        house_number: site?.houseNumber || site?.house_number || "",
        description: site?.description || "",
        lat: site?.lat || 31.25,
        lng: site?.lng || 34.79,
        start_date_d: startParts.date,
        start_date_h: startParts.hour,
        start_date_m: startParts.minute,
        end_date_d: endParts.date,
        end_date_h: endParts.hour,
        end_date_m: endParts.minute,
        phone: site?.phone || "",
        contact_name: site?.contactName || site?.contact_name || "",
      };
    }
  };

  const [activeSiteType, setActiveSiteType] = useState(siteType);
  const [formData, setFormData] = useState(() => getInitialFormData(siteType));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleTypeToggle = (newType) => {
    if (newType === activeSiteType) return;
    setActiveSiteType(newType);
    setFormData(getInitialFormData(newType));
    setError("");
  };
  const [scrollTrigger, setScrollTrigger] = useState(0);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const modalRef = useRef(null);

  // Scroll to top every time a validation error fires (even if same message)
  useEffect(() => {
    if (scrollTrigger > 0) {
      modalRef.current?.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [scrollTrigger]);

  // ── Derived category/sub-category structures ─────────────────────────────
  // Filter out non-site keys (districts, temp events) from the live structure
  const siteCategories = useMemo(() => {
    if (!categoriesStructure) return [];
    return Object.keys(categoriesStructure).filter(
      (k) => !EXCLUDED_STRUCTURE_KEYS.includes(k)
    );
  }, [categoriesStructure]);

  // Sub-categories available for the currently selected category.
  // If no category is selected yet, show ALL sub-categories so the user
  // can pick sub first and have the category auto-filled.
  const availableSubCategories = useMemo(() => {
    if (!categoriesStructure) return [];
    if (formData.category) {
      return categoriesStructure[formData.category] || [];
    }
    // No category selected → flatten all sub-categories from all real categories
    return Object.entries(categoriesStructure)
      .filter(([cat]) => !EXCLUDED_STRUCTURE_KEYS.includes(cat))
      .flatMap(([, subs]) => subs);
  }, [categoriesStructure, formData.category]);

  // When end date equals start date, only allow hours >= start hour
  const endHourOptions = useMemo(() => {
    if (
      formData.end_date_d &&
      formData.end_date_d === formData.start_date_d &&
      formData.start_date_h
    ) {
      return HOUR_OPTIONS.filter((h) => h >= formData.start_date_h);
    }
    return HOUR_OPTIONS;
  }, [formData.end_date_d, formData.start_date_d, formData.start_date_h]);

  // When same day AND same hour, only allow minutes > start minute
  const endMinuteOptions = useMemo(() => {
    if (
      formData.end_date_d === formData.start_date_d &&
      formData.end_date_h === formData.start_date_h &&
      formData.start_date_m
    ) {
      return MINUTE_OPTIONS.filter((m) => m > formData.start_date_m);
    }
    return MINUTE_OPTIONS;
  }, [
    formData.end_date_d, formData.start_date_d,
    formData.end_date_h, formData.start_date_h,
    formData.start_date_m,
  ]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const next = {
        ...prev,
        [name]: name === "lat" || name === "lng" ? parseFloat(value) || 0 : value,
      };

      // When category changes, clear sub_category if it no longer belongs
      if (name === "category" && categoriesStructure) {
        const subs = categoriesStructure[value] || [];
        if (!subs.includes(prev.sub_category)) {
          next.sub_category = "";
        }
      }

      // When sub_category is chosen, auto-fill parent category
      if (name === "sub_category" && value && categoriesStructure) {
        const parentCat = Object.entries(categoriesStructure).find(
          ([cat, subs]) =>
            !EXCLUDED_STRUCTURE_KEYS.includes(cat) && subs.includes(value)
        )?.[0];
        if (parentCat) next.category = parentCat;
      }

      // When start date/hour/minute changes, auto-reset end if it becomes invalid
      if (name === "start_date_d" && next.end_date_d && next.end_date_d < value) {
        next.end_date_d = "";
        next.end_date_h = "";
        next.end_date_m = "";
      }
      if (
        (name === "start_date_h" || name === "start_date_d") &&
        next.end_date_d === next.start_date_d &&
        next.end_date_h &&
        next.end_date_h < (name === "start_date_h" ? value : next.start_date_h)
      ) {
        next.end_date_h = "";
        next.end_date_m = "";
      }
      if (
        (name === "start_date_m" || name === "start_date_h") &&
        next.end_date_d === next.start_date_d &&
        next.end_date_h === next.start_date_h &&
        next.end_date_m &&
        next.end_date_m <= (name === "start_date_m" ? value : next.start_date_m)
      ) {
        next.end_date_m = "";
      }

      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    const missing = [];
    if (!formData.name.trim()) missing.push("שם");
    if (!formData.category)   missing.push("קטגוריה");
    if (!formData.lat)        missing.push("קו רוחב (Lat)");
    if (!formData.lng)        missing.push("קו אורך (Lng)");
    if (!formData.sub_category)    missing.push("תת-קטגוריה");
    if (!formData.district.trim()) missing.push("שכונה/רובע");
    
    // Temporary-only required fields
    if (activeSiteType === "temporary" && !formData.end_date_d) missing.push("תאריך סיום");

    if (missing.length > 0) {
      setError(`שדות חובה חסרים: ${missing.join(", ")}`);
      setScrollTrigger((n) => n + 1);
      return;
    }

    setIsLoading(true);

    try {
      const payload = { ...formData };

      // Convert and validate dates for temporary sites
      if (activeSiteType === "temporary") {

        // Combine split date+hour+minute back into ISO strings
        const startCombined = combineDateTime(payload.start_date_d, payload.start_date_h, payload.start_date_m);
        const endCombined   = combineDateTime(payload.end_date_d,   payload.end_date_h,   payload.end_date_m);

        delete payload.start_date_d; delete payload.start_date_h; delete payload.start_date_m;
        delete payload.end_date_d;   delete payload.end_date_h;   delete payload.end_date_m;

        if (startCombined) {
          const d = new Date(startCombined);
          if (isNaN(d.getTime())) { setError("תאריך התחלה אינו תקין"); setIsLoading(false); return; }
          payload.start_date = d.toISOString();
        }
        if (endCombined) {
          const d = new Date(endCombined);
          if (isNaN(d.getTime())) { setError("תאריך סיום אינו תקין"); setIsLoading(false); return; }
          payload.end_date = d.toISOString();
        }
        if (payload.start_date && payload.end_date && payload.start_date >= payload.end_date) {
          setError("תאריך הסיום חייב להיות אחרי תאריך ההתחלה");
          setIsLoading(false);
          return;
        }
      }

      if (activeSiteType === "permanent") {
        if (isNew) {
          await createPermanentSiteAuth(payload, authHeader);
        } else {
          await updatePermanentSiteAuth(site.id, payload, authHeader);
        }
      } else {
        if (isNew) {
          await createTemporarySiteAuth(payload, authHeader);
        } else {
          await updateTemporarySiteAuth(site.id, payload, authHeader);
        }
      }

      onSave?.(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    setError("");
    try {
      if (activeSiteType === "permanent") {
        await deletePermanentSiteAuth(site.id, authHeader);
      } else {
        await deleteTemporarySiteAuth(site.id, authHeader);
      }
      onSave?.(true); // pass true to indicate it was a deletion
    } catch (err) {
      setError(err.message);
      setShowDeleteConfirm(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Location picker — renders fullscreen over everything */}
      {showLocationPicker && (
        <LocationPickerMap
          initialLat={formData.lat}
          initialLng={formData.lng}
          onConfirm={({ lat, lng }) => {
            setFormData((prev) => ({ ...prev, lat, lng }));
            setShowLocationPicker(false);
          }}
          onCancel={() => setShowLocationPicker(false)}
        />
      )}

      {/* Delete confirmation overlay */}
      {showDeleteConfirm && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 30000,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.6)"
        }}>
          <div style={{
            background: "white", padding: 24, borderRadius: 12,
            width: "90%", maxWidth: 320, textAlign: "center",
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            direction: "rtl"
          }}>
            <h3 style={{ margin: "0 0 16px 0", color: "#d32f2f" }}>⚠️ אישור מחיקה</h3>
            <p style={{ margin: "0 0 24px 0", fontSize: 15 }}>האם אתה בטוח שברצונך למחוק {activeSiteType === "permanent" ? "אתר" : "אירוע"} זה?</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isLoading}
                style={{
                  padding: "8px 20px", borderRadius: 6, border: "1px solid #ccc",
                  background: "#f5f5f5", cursor: "pointer", fontWeight: "bold"
                }}
              >
                לא, בטל
              </button>
              <button
                onClick={handleDelete}
                disabled={isLoading}
                style={{
                  padding: "8px 20px", borderRadius: 6, border: "none",
                  background: "#d32f2f", color: "white", cursor: "pointer", fontWeight: "bold"
                }}
              >
                {isLoading ? "מוחק..." : "כן, מחק"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>
            {isNew
              ? activeSiteType === "permanent"
                ? "➕ הוספת אתר חדש"
                : "➕ הוספת אירוע חדש"
              : activeSiteType === "permanent"
                ? "✏️ עריכת אתר"
                : "✏️ עריכת אירוע"}
          </h2>
          <button className={styles.closeBtn} onClick={onClose}>
            ×
          </button>
        </div>

        {/* Type toggle — only shown when creating a new entry */}
        {isNew && (
          <div style={{
            display: "flex",
            background: "#f0f0f0",
            borderRadius: 10,
            padding: 4,
            margin: "0 16px 16px",
            direction: "rtl",
          }}>
            <button
              type="button"
              onClick={() => handleTypeToggle("permanent")}
              style={{
                flex: 1,
                padding: "8px 12px",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 14,
                transition: "all 0.2s",
                background: activeSiteType === "permanent" ? "white" : "transparent",
                color: activeSiteType === "permanent" ? "#1565c0" : "#666",
                boxShadow: activeSiteType === "permanent" ? "0 1px 4px rgba(0,0,0,0.15)" : "none",
              }}
            >
              📍 אתר קבוע
            </button>
            <button
              type="button"
              onClick={() => handleTypeToggle("temporary")}
              style={{
                flex: 1,
                padding: "8px 12px",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 14,
                transition: "all 0.2s",
                background: activeSiteType === "temporary" ? "white" : "transparent",
                color: activeSiteType === "temporary" ? "#e65100" : "#666",
                boxShadow: activeSiteType === "temporary" ? "0 1px 4px rgba(0,0,0,0.15)" : "none",
              }}
            >
              ⚡ אירוע זמני
            </button>
          </div>
        )}

        <form className={styles.form} ref={modalRef} onSubmit={handleSubmit}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.field}>
            <label>שם *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="שם האתר/אירוע"
            />
          </div>

          <div className={styles.field}>
            <label>תיאור</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="תיאור..."
              rows={3}
            />
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label>קטגוריה *</label>
              <select name="category" value={formData.category} onChange={handleChange}>
                <option value="">בחר קטגוריה</option>
                {(siteCategories.length > 0 ? siteCategories : []).map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label>תת-קטגוריה *</label>
              <select name="sub_category" value={formData.sub_category} onChange={handleChange}>
                <option value="">
                  {formData.category
                    ? availableSubCategories.length > 0
                      ? "בחר תת-קטגוריה"
                      : "אין תת-קטגוריות"
                    : "בחר קטגוריה "}
                </option>
                {availableSubCategories.map((sub) => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label>סוג</label>
              <input
                type="text"
                name="type"
                value={formData.type}
                onChange={handleChange}
                placeholder="סוג (לדוגמה: בי''ס יסודי)"
              />
            </div>
            <div className={styles.field}>
              <label>שכונה/רובע *</label>
              <select name="district" value={formData.district} onChange={handleChange}>
                <option value="">בחר שכונה/רובע</option>
                {DISTRICTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>
          <div className={styles.row}>
            <div className={styles.field}>
              <label>רחוב</label>
              <input
                type="text"
                name="street"
                value={formData.street}
                onChange={handleChange}
                placeholder="שם רחוב"
              />
            </div>
            <div className={styles.field}>
              <label>מספר בית</label>
              <input
                type="text"
                name="house_number"
                value={formData.house_number}
                onChange={handleChange}
                placeholder="מספר"
              />
            </div>
          </div>

          {activeSiteType === "temporary" && (
            <>
              {/* Start: date / minute / hour — all in one row, same height */}
              <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
                <div className={styles.field} style={{ flex: 2, display: "flex", flexDirection: "column" }}>
                  <label>תאריך התחלה</label>
                  <input
                    type="date"
                    name="start_date_d"
                    value={formData.start_date_d}
                    onChange={handleChange}
                    style={{ flex: 1 }}
                  />
                </div>
                <div className={styles.field} style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                  <label>דקות</label>
                  <select name="start_date_m" value={formData.start_date_m} onChange={handleChange} style={{ flex: 1 }}>
                    <option value="">דק׳</option>
                    {MINUTE_OPTIONS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.field} style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                  <label>שעה</label>
                  <select name="start_date_h" value={formData.start_date_h} onChange={handleChange} style={{ flex: 1 }}>
                    <option value="">שע׳</option>
                    {HOUR_OPTIONS.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* End: date / minute / hour — all in one row, same height */}
              <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
                <div className={styles.field} style={{ flex: 2, display: "flex", flexDirection: "column" }}>
                  <label>תאריך סיום *</label>
                  <input
                    type="date"
                    name="end_date_d"
                    value={formData.end_date_d}
                    onChange={handleChange}
                    min={formData.start_date_d || undefined}
                    style={{ flex: 1 }}
                  />
                </div>
                <div className={styles.field} style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                  <label>דקות</label>
                  <select name="end_date_m" value={formData.end_date_m} onChange={handleChange} style={{ flex: 1 }}>
                    <option value="">דקות</option>
                    {endMinuteOptions.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.field} style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                  <label>שעה</label>
                  <select name="end_date_h" value={formData.end_date_h} onChange={handleChange} style={{ flex: 1 }}>
                    <option value="">שעה</option>
                    {endHourOptions.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

          <div className={styles.row}>
            <div className={styles.field}>
              <label>קו רוחב (Lat) *</label>
              <input
                type="number"
                name="lat"
                value={formData.lat}
                onChange={handleChange}
                step="0.00001"
                dir="ltr"
              />
            </div>
            <div className={styles.field}>
              <label>קו אורך (Lng) *</label>
              <input
                type="number"
                name="lng"
                value={formData.lng}
                onChange={handleChange}
                step="0.00001"
                dir="ltr"
              />
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <button
              type="button"
              onClick={() => setShowLocationPicker(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 18px",
                background: "linear-gradient(135deg, #1565c0 0%, #1976d2 100%)",
                color: "white",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 600,
                boxShadow: "0 2px 8px rgba(21,101,192,0.3)",
              }}
            >
              <span style={{ fontSize: 18 }}>📍</span>
              בחר מיקום חדש
            </button>
          </div>

          <div className={styles.divider}>פרטי קשר</div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label>שם איש קשר</label>
              <input
                type="text"
                name="contact_name"
                value={formData.contact_name}
                onChange={handleChange}
                placeholder="שם"
              />
            </div>
            <div className={styles.field}>
              <label>טלפון</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="050-1234567"
                dir="ltr"
              />
            </div>
          </div>

          <div className={styles.actions} style={{ display: "flex", gap: 12, width: "100%" }}>
            <button 
              type="submit" 
              className={styles.saveBtn} 
              disabled={isLoading}
              style={{ flex: 1, padding: "14px 16px" }}
            >
              {isLoading ? "שומר..." : isNew ? "הוסף" : "שמור"}
            </button>
            <button 
              type="button" 
              className={styles.cancelBtn} 
              onClick={onClose}
              style={{ flex: 1, padding: "14px 16px", textAlign: "center" }}
            >
              בטל
            </button>
            {!isNew && (
              <button 
                type="button" 
                onClick={() => setShowDeleteConfirm(true)}
                style={{
                  flex: 1,
                  background: "#ffebee",
                  color: "#d32f2f",
                  border: "1px solid #ffcdd2",
                  borderRadius: 8,
                  padding: "14px 16px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                🗑️ מחיקה
              </button>
            )}
          </div>
        </form>
      </div>
    </>
  );
}

