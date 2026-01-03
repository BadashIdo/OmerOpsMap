import { useState, useEffect } from "react";
import { fetchPermanentSites, deletePermanentSiteAuth } from "../../api/dataService";
import SiteEditModal from "./SiteEditModal";
import styles from "../../styles/AdminTab.module.css";

export default function PermanentSitesTab({ authHeader, onDataChange }) {
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
            site.sub_category?.toLowerCase().includes(term)
        )
      );
    } else {
      setFilteredSites(sites);
    }
  }, [sites, searchTerm]);

  const loadSites = async () => {
    setIsLoading(true);
    try {
      const data = await fetchPermanentSites();
      setSites(data);
      setError("");
    } catch (err) {
      setError("שגיאה בטעינת האתרים");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (siteId) => {
    if (!confirm("האם למחוק את האתר?")) return;

    try {
      await deletePermanentSiteAuth(siteId, authHeader);
      loadSites();
      onDataChange?.();
    } catch (err) {
      alert("שגיאה במחיקת האתר");
      console.error(err);
    }
  };

  const handleSiteAction = () => {
    loadSites();
    onDataChange?.();
    setSelectedSite(null);
    setIsAddMode(false);
  };

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <span>טוען אתרים...</span>
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
        <h3 className={styles.title}>אתרים קבועים ({sites.length})</h3>
        <button className={styles.addBtn} onClick={() => setIsAddMode(true)}>
          ➕ הוסף אתר
        </button>
      </div>

      <div className={styles.search}>
        <input
          type="text"
          placeholder="חפש לפי שם או קטגוריה..."
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
          <div className={styles.emptyIcon}>📍</div>
          <h3>לא נמצאו אתרים</h3>
          <p>{searchTerm ? "נסה לחפש משהו אחר" : "לחץ על 'הוסף אתר' כדי להתחיל"}</p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>שם</th>
                <th>קטגוריה</th>
                <th>תת-קטגוריה</th>
                <th>מיקום</th>
                <th>פעולות</th>
              </tr>
            </thead>
            <tbody>
              {filteredSites.map((site) => (
                <tr key={site.id}>
                  <td>{site.name}</td>
                  <td>{site.category || "-"}</td>
                  <td>{site.sub_category || "-"}</td>
                  <td>
                    {site.lat?.toFixed(4)}, {site.lng?.toFixed(4)}
                  </td>
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
          siteType="permanent"
          authHeader={authHeader}
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

