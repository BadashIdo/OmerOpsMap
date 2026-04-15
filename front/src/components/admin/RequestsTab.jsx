import { useState, useEffect } from "react";
import { getPendingRequests } from "../../api/requestsApi";
import RequestReviewModal from "./RequestReviewModal";
import styles from "../../styles/AdminTab.module.css";

const REQUEST_TYPE_INFO = {
  hazard: { icon: "⚠️", label: "מפגע" },
  roadwork: { icon: "🚧", label: "עבודות" },
  event: { icon: "🎉", label: "אירוע" },
  new_site: { icon: "📍", label: "אתר חדש" },
  correction: { icon: "✏️", label: "תיקון" },
  other: { icon: "📝", label: "אחר" },
};

export default function RequestsTab({ authHeader, onDataChange }) {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setIsLoading(true);
    try {
      const data = await getPendingRequests(authHeader);
      setRequests(data);
      setError("");
    } catch (err) {
      setError("שגיאה בטעינת הבקשות");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestAction = () => {
    loadRequests();
    onDataChange?.();
    setSelectedRequest(null);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) return `לפני ${minutes} דקות`;
    if (hours < 24) return `לפני ${hours} שעות`;
    if (days < 7) return `לפני ${days} ימים`;
    
    return date.toLocaleDateString("he-IL");
  };

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <span>טוען בקשות...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        {error}
        <button onClick={loadRequests}>נסה שנית</button>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>📭</div>
        <h3>אין בקשות ממתינות</h3>
        <p>כל הבקשות טופלו</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>בקשות ממתינות ({requests.length})</h3>
        <button className={styles.refreshBtn} onClick={loadRequests}>
          🔄 רענן
        </button>
      </div>

      <div className={styles.list}>
        {requests.map((request) => {
          const typeInfo = REQUEST_TYPE_INFO[request.request_type] || { icon: "📌", label: request.request_type };
          
          return (
            <div
              key={request.id}
              className={styles.card}
              onClick={() => setSelectedRequest(request)}
            >
              <div className={styles.cardHeader}>
                <span className={styles.cardIcon}>{typeInfo.icon}</span>
                <div className={styles.cardTitle}>
                  <h4>{request.name}</h4>
                  <span className={styles.cardType}>{typeInfo.label}</span>
                </div>
                {request.is_temporary && (
                  <span className={styles.tempBadge}>זמני</span>
                )}
              </div>

              <div className={styles.cardBody}>
                {request.description && (
                  <p className={styles.cardDesc}>
                    {request.description.substring(0, 100)}
                    {request.description.length > 100 ? "..." : ""}
                  </p>
                )}
                
                <div className={styles.cardMeta}>
                  <span>👤 {request.submitter_name}</span>
                  {request.submitter_phone && <span>📱 {request.submitter_phone}</span>}
                </div>
              </div>

              <div className={styles.cardFooter}>
                <span className={styles.cardTime}>{formatDate(request.created_at)}</span>
                <button className={styles.viewBtn}>
                  לצפייה →
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {selectedRequest && (
        <RequestReviewModal
          request={selectedRequest}
          authHeader={authHeader}
          onClose={() => setSelectedRequest(null)}
          onAction={handleRequestAction}
        />
      )}
    </div>
  );
}

