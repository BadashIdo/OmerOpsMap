import { useMemo, useState } from "react";
import {
  createPermanentSiteAuth,
  updatePermanentSiteAuth,
  createTemporarySiteAuth,
  updateTemporarySiteAuth,
} from "../../api/dataService";
import styles from "../../styles/SiteEditModal.module.css";

const PRIORITIES = [
  { value: "low", label: "נמוכה" },
  { value: "medium", label: "בינונית" },
  { value: "high", label: "גבוהה" },
  { value: "critical", label: "קריטית" },
];

const STATUSES = [
  { value: "active", label: "פעיל" },
  { value: "scheduled", label: "מתוכנן" },
  { value: "cancelled", label: "בוטל" },
];

export default function SiteEditModal({
  site,
  siteType,
  authHeader,
  onClose,
  onSave,
  onPickLocation,
  categoriesStructure = {},
}) {
  const isNew = !site;
  
  const getInitialFormData = () => {
    if (siteType === "permanent") {
      return {
        name: site?.name || "",
        category: site?.category || "",
        sub_category: site?.sub_category || "",
        type: site?.type || "",
        district: site?.district || "",
        street: site?.street || "",
        house_number: site?.house_number || "",
        description: site?.description || "",
        lat: site?.lat || 31.25,
        lng: site?.lng || 34.79,
        phone: site?.phone || "",
        contact_name: site?.contact_name || "",
      };
    } else {
      return {
        name: site?.name || "",
        category: site?.category || "",
        description: site?.description || "",
        lat: site?.lat || 31.25,
        lng: site?.lng || 34.79,
        start_date: site?.start_date ? site.start_date.substring(0, 16) : "",
        end_date: site?.end_date ? site.end_date.substring(0, 16) : "",
        priority: site?.priority || "medium",
        status: site?.status || "active",
        phone: site?.phone || "",
        contact_name: site?.contact_name || "",
      };
    }
  };

  const [formData, setFormData] = useState(getInitialFormData());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const categoryOptions = useMemo(() => {
    if (siteType !== "permanent") return [];
    return Object.keys(categoriesStructure || {}).filter(
      (cat) => cat && cat !== "רובעים" && cat !== "אירועים זמניים"
    );
  }, [categoriesStructure, siteType]);

  const allSubCategoryEntries = useMemo(() => {
    if (siteType !== "permanent") return [];
    return categoryOptions.flatMap((category) =>
      (categoriesStructure?.[category] || [])
        .filter(Boolean)
        .map((sub) => ({ sub, category }))
    );
  }, [categoriesStructure, categoryOptions, siteType]);

  const subCategoryOptions = useMemo(() => {
    if (siteType !== "permanent") return [];
    if (formData.category) {
      return (categoriesStructure?.[formData.category] || []).filter(Boolean);
    }
    return [...new Set(allSubCategoryEntries.map((entry) => entry.sub))];
  }, [categoriesStructure, formData.category, allSubCategoryEntries, siteType]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (siteType === "permanent" && name === "category") {
      const allowedSubCategories = (categoriesStructure?.[value] || []).filter(Boolean);
      setFormData((prev) => ({
        ...prev,
        category: value,
        sub_category: allowedSubCategories.includes(prev.sub_category) ? prev.sub_category : "",
      }));
      return;
    }

    if (siteType === "permanent" && name === "sub_category") {
      const entry = allSubCategoryEntries.find((item) => item.sub === value);
      setFormData((prev) => ({
        ...prev,
        sub_category: value,
        category: entry?.category || prev.category,
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: name === "lat" || name === "lng" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.name.trim()) {
      setError("נא להזין שם");
      return;
    }

    if (siteType === "permanent") {
      const invalidCategory =
        !formData.category ||
        formData.category === "בחר קטגוריה";
      const invalidSubCategory =
        !formData.sub_category ||
        formData.sub_category === "בחר תת-קטגוריה";

      if (invalidCategory) {
        setError("קטגוריה היא שדה חובה");
        return;
      }

      if (invalidSubCategory) {
        setError("תת-קטגוריה היא שדה חובה");
        return;
      }
    }

    if (siteType === "temporary" && !formData.end_date) {
      setError("נא להזין תאריך סיום");
      return;
    }

    setIsLoading(true);

    try {
      const payload = { ...formData };
      
      // Convert dates to ISO format for temporary sites
      if (siteType === "temporary") {
        if (payload.start_date) {
          payload.start_date = new Date(payload.start_date).toISOString();
        }
        if (payload.end_date) {
          payload.end_date = new Date(payload.end_date).toISOString();
        }
      }

      if (siteType === "permanent") {
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

      onSave?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>
            {isNew
              ? siteType === "permanent"
                ? "➕ הוספת אתר חדש"
                : "➕ הוספת אירוע חדש"
              : siteType === "permanent"
              ? "✏️ עריכת אתר"
              : "✏️ עריכת אירוע"}
          </h2>
          <button className={styles.closeBtn} onClick={onClose}>
            ×
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
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
              <label>קטגוריה</label>
              <select name="category" value={formData.category} onChange={handleChange}>
                <option value="">בחר קטגוריה</option>
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {siteType === "permanent" && (
              <div className={styles.field}>
                <label>תת-קטגוריה</label>
                <select
                  name="sub_category"
                  value={formData.sub_category}
                  onChange={handleChange}
                >
                  <option value="">בחר תת-קטגוריה</option>
                  {subCategoryOptions.map((sub) => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {siteType === "permanent" && (
            <>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label>סוג אתר</label>
                  <input
                    type="text"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    placeholder="סוג"
                  />
                </div>
                <div className={styles.field}>
                  <label>רובע</label>
                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    placeholder="רובע"
                  />
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
                    placeholder="רחוב"
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
            </>
          )}

          {siteType === "temporary" && (
            <>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label>תאריך התחלה</label>
                  <input
                    type="datetime-local"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleChange}
                  />
                </div>
                <div className={styles.field}>
                  <label>תאריך סיום *</label>
                  <input
                    type="datetime-local"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label>דחיפות</label>
                  <select name="priority" value={formData.priority} onChange={handleChange}>
                    {PRIORITIES.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.field}>
                  <label>סטטוס</label>
                  <select name="status" value={formData.status} onChange={handleChange}>
                    {STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

          <div className={styles.row}>
            <div className={styles.field}>
              <label>קו רוחב (Lat)</label>
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
              <label>קו אורך (Lng)</label>
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

          {siteType === "permanent" && typeof onPickLocation === "function" && (
            <div className={styles.field}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => onPickLocation(formData)}
                style={{ width: "100%" }}
              >
                📍 בחירת מיקום מהמפה
              </button>
            </div>
          )}

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

          <div className={styles.actions}>
            <button type="submit" className={styles.saveBtn} disabled={isLoading}>
              {isLoading ? "שומר..." : isNew ? "הוסף" : "שמור"}
            </button>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              בטל
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

