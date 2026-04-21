import { useState, useEffect } from "react";
import { fetchTemporarySites, deleteTemporarySiteAuth } from "../../api/sitesApi";
import SiteEditModal from "./SiteEditModal";
import styles from "../../styles/AdminTab.module.css";

const PRIORITY_COLORS = {
  low: "#4CAF50",
  medium: "#FF9800",
  high: "#FF5722",
  critical: "#F44336",
};

const PRIORITY_LABELS = {
  low: "נמוכה",
  medium: "בינונית",
  high: "גבוהה",
  critical: "קריטית",
};

const STATUS_LABELS = {
  active: "פעיל",
  scheduled: "מתוכנן",
  expired: "פג תוקף",
  cancelled: "בוטל",
};

export default function TemporarySitesTab({ authHeader, onDataChange, categoriesStructure }) {
  const [sites, setSites] = useState([]);
  const [filteredSites, setFilteredSites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSite, setSelectedSite] = useState(null);
  const [isAddMode, setIsAddMode] = useState(false);

  useEffect(() => {
    loadSites();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      setFilteredSites(
        sites.filter(
          (site) =>
            site.name?.toLowerCase().includes(term) ||
            site.category?.toLowerCase().includes(term) ||
            site.description?.toLowerCase().includes(term)
        )
      );
    } else {
      setFilteredSites(sites);
    }
  }, [sites, searchTerm]);

  const loadSites = async () => {
    setIsLoading(true);
    try {
      const data = await fetchTemporarySites();
      setSites(data);
      setError("");
    } catch (err) {
      setError("שגיאה בטעינת האירועים");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (siteId) => {
    if (!confirm("האם למחוק את האירוע?")) return;

    try {
      await deleteTemporarySiteAuth(siteId, authHeader);
      loadSites();
      onDataChange?.();
    } catch (err) {
      alert("שגיאה במחיקת האירוע");
      console.error(err);
    }
  };

  const handleSiteAction = () => {
    loadSites();
    onDataChange?.();
    setSelectedSite(null);
    setIsAddMode(false);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("he-IL", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <span>טוען אירועים...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        {error}
        <button onClick={loadSites}>נסה שנית</button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>אירועים זמניים ({sites.length})</h3>
        <button className={styles.addBtn} onClick={() => setIsAddMode(true)}>
          ➕ הוסף אירוע
        </button>
      </div>

      <div className={styles.search}>
        <input
          type="text"
          placeholder="חפש לפי שם או תיאור..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
        <button className={styles.refreshBtn} onClick={loadSites}>
          🔄
        </button>
      </div>

      {filteredSites.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>⚡</div>
          <h3>לא נמצאו אירועים</h3>
          <p>{searchTerm ? "נסה לחפש משהו אחר" : "לחץ על 'הוסף אירוע' כדי להתחיל"}</p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>שם</th>
                <th>סטטוס</th>
                <th>דחיפות</th>
                <th>סיום</th>
                <th>פעולות</th>
              </tr>
            </thead>
            <tbody>
              {filteredSites.map((site) => (
                <tr key={site.id}>
                  <td>
                    <strong>{site.name}</strong>
                    {site.description && (
                      <div style={{ fontSize: "12px", color: "#888", marginTop: "2px" }}>
                        {site.description.substring(0, 50)}...
                      </div>
                    )}
                  </td>
                  <td>
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: "10px",
                        fontSize: "12px",
                        background:
                          site.status === "active"
                            ? "#e8f5e9"
                            : site.status === "scheduled"
                            ? "#e3f2fd"
                            : "#f5f5f5",
                        color:
                          site.status === "active"
                            ? "#2e7d32"
                            : site.status === "scheduled"
                            ? "#1565c0"
                            : "#666",
                      }}
                    >
                      {STATUS_LABELS[site.status] || site.status}
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        color: PRIORITY_COLORS[site.priority] || "#666",
                        fontWeight: "600",
                      }}
                    >
                      {PRIORITY_LABELS[site.priority] || site.priority}
                    </span>
                  </td>
                  <td style={{ fontSize: "13px" }}>{formatDate(site.end_date)}</td>
                  <td>
                    <div className={styles.tableActions}>
                      <button
                        className={styles.editBtn}
                        onClick={() => setSelectedSite(site)}
                      >
                        ✏️ ערוך
                      </button>
                      <button
                        className={styles.deleteBtn}
                        onClick={() => handleDelete(site.id)}
                      >
                        🗑️ מחק
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(selectedSite || isAddMode) && (
        <SiteEditModal
          site={selectedSite}
          siteType="temporary"
          authHeader={authHeader}
          categoriesStructure={categoriesStructure}
          onClose={() => {
            setSelectedSite(null);
            setIsAddMode(false);
          }}
          onSave={handleSiteAction}
        />
      )}
    </div>
  );
}

