import { useState } from "react";
import { updateRequest, approveRequest, rejectRequest } from "../../api/requestsApi";
import styles from "../../styles/RequestReviewModal.module.css";

const REQUEST_TYPE_INFO = {
  hazard: { icon: "⚠️", label: "מפגע" },
  roadwork: { icon: "🚧", label: "עבודות" },
  event: { icon: "🎉", label: "אירוע" },
  new_site: { icon: "📍", label: "אתר חדש" },
  correction: { icon: "✏️", label: "תיקון" },
  other: { icon: "📝", label: "אחר" },
};

const PRIORITIES = [
  { value: "low", label: "נמוכה", color: "#4CAF50" },
  { value: "medium", label: "בינונית", color: "#FF9800" },
  { value: "high", label: "גבוהה", color: "#FF5722" },
  { value: "critical", label: "קריטית", color: "#F44336" },
];

export default function RequestReviewModal({ request, authHeader, onClose, onAction }) {
  const [editedRequest, setEditedRequest] = useState({ ...request });
  const [isEditing, setIsEditing] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const typeInfo = REQUEST_TYPE_INFO[request.request_type] || { icon: "📌", label: request.request_type };

  const handleFieldChange = (field, value) => {
    setEditedRequest((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveEdits = async () => {
    setIsLoading(true);
    setError("");
    try {
      await updateRequest(request.id, editedRequest, authHeader);
      setIsEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!confirm("האם לאשר את הבקשה ולהוסיף את האתר למפה?")) return;
    
    setIsLoading(true);
    setError("");
    try {
      await approveRequest(request.id, authHeader);
      onAction?.();
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setError("נא להזין סיבת דחייה");
      return;
    }
    
    setIsLoading(true);
    setError("");
    try {
      await rejectRequest(request.id, rejectReason, authHeader);
      onAction?.();
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("he-IL");
  };

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <span className={styles.typeIcon}>{typeInfo.icon}</span>
            <div>
              <h2>{request.name}</h2>
              <span className={styles.typeLabel}>{typeInfo.label}</span>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.content}>
          {error && <div className={styles.error}>{error}</div>}

          {/* Request Details */}
          <div className={styles.section}>
            <h3>פרטי הבקשה</h3>
            
            <div className={styles.field}>
              <label>שם/כותרת</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedRequest.name}
                  onChange={(e) => handleFieldChange("name", e.target.value)}
                />
              ) : (
                <span>{request.name}</span>
              )}
            </div>

            <div className={styles.field}>
              <label>תיאור</label>
              {isEditing ? (
                <textarea
                  value={editedRequest.description || ""}
                  onChange={(e) => handleFieldChange("description", e.target.value)}
                  rows={3}
                />
              ) : (
                <span>{request.description || "-"}</span>
              )}
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label>קטגוריה</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedRequest.category || ""}
                    onChange={(e) => handleFieldChange("category", e.target.value)}
                  />
                ) : (
                  <span>{request.category || "-"}</span>
                )}
              </div>
              <div className={styles.field}>
                <label>דחיפות</label>
                {isEditing ? (
                  <select
                    value={editedRequest.priority}
                    onChange={(e) => handleFieldChange("priority", e.target.value)}
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                ) : (
                  <span style={{ color: PRIORITIES.find(p => p.value === request.priority)?.color }}>
                    {PRIORITIES.find(p => p.value === request.priority)?.label || request.priority}
                  </span>
                )}
              </div>
            </div>

            <div className={styles.field}>
              <label>סוג</label>
              <span>{request.is_temporary ? "זמני" : "קבוע"}</span>
            </div>

            {request.is_temporary && (
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label>תאריך התחלה</label>
                  <span>{formatDate(request.start_date)}</span>
                </div>
                <div className={styles.field}>
                  <label>תאריך סיום</label>
                  <span>{formatDate(request.end_date)}</span>
                </div>
              </div>
            )}

            <div className={styles.field}>
              <label>מיקום</label>
              <span>
                {request.lat?.toFixed(5)}, {request.lng?.toFixed(5)}
              </span>
            </div>
          </div>

          {/* Submitter Info */}
          <div className={styles.section}>
            <h3>פרטי המדווח</h3>
            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label>שם</label>
                <span>{request.submitter_name}</span>
              </div>
              <div className={styles.field}>
                <label>טלפון</label>
                <span>{request.submitter_phone || "-"}</span>
              </div>
              <div className={styles.field}>
                <label>אימייל</label>
                <span>{request.submitter_email || "-"}</span>
              </div>
            </div>
            <div className={styles.field}>
              <label>נשלח בתאריך</label>
              <span>{formatDate(request.created_at)}</span>
            </div>
          </div>

          {/* Admin Notes */}
          {isEditing && (
            <div className={styles.section}>
              <h3>הערות מנהל</h3>
              <textarea
                value={editedRequest.admin_notes || ""}
                onChange={(e) => handleFieldChange("admin_notes", e.target.value)}
                placeholder="הערות פנימיות..."
                rows={2}
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          {isEditing ? (
            <>
              <button
                className={styles.saveBtn}
                onClick={handleSaveEdits}
                disabled={isLoading}
              >
                שמור שינויים
              </button>
              <button
                className={styles.cancelBtn}
                onClick={() => {
                  setEditedRequest({ ...request });
                  setIsEditing(false);
                }}
              >
                בטל
              </button>
            </>
          ) : (
            <>
              <button
                className={styles.approveBtn}
                onClick={handleApprove}
                disabled={isLoading}
              >
                ✅ אשר והוסף למפה
              </button>
              <button
                className={styles.rejectBtn}
                onClick={() => setShowRejectDialog(true)}
                disabled={isLoading}
              >
                ❌ דחה
              </button>
              <button
                className={styles.editBtn}
                onClick={() => setIsEditing(true)}
              >
                ✏️ ערוך
              </button>
            </>
          )}
        </div>

        {/* Reject Dialog */}
        {showRejectDialog && (
          <div className={styles.rejectDialog}>
            <h4>סיבת הדחייה</h4>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="הסבר למדווח מדוע הבקשה נדחתה..."
              rows={3}
            />
            <div className={styles.rejectActions}>
              <button
                className={styles.confirmRejectBtn}
                onClick={handleReject}
                disabled={isLoading}
              >
                אשר דחייה
              </button>
              <button
                className={styles.cancelRejectBtn}
                onClick={() => {
                  setShowRejectDialog(false);
                  setRejectReason("");
                }}
              >
                בטל
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

