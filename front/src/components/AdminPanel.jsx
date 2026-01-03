import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getPendingRequestsCount } from "../api/dataService";
import RequestsTab from "./admin/RequestsTab";
import PermanentSitesTab from "./admin/PermanentSitesTab";
import TemporarySitesTab from "./admin/TemporarySitesTab";
import styles from "../styles/AdminPanel.module.css";

const TABS = [
  { id: "requests", label: "בקשות", icon: "📋" },
  { id: "permanent", label: "אתרים קבועים", icon: "📍" },
  { id: "temporary", label: "אירועים זמניים", icon: "⚡" },
];

export default function AdminPanel({ isOpen, onClose, onDataChange }) {
  const { admin, logout, getAuthHeader } = useAuth();
  const [activeTab, setActiveTab] = useState("requests");
  const [pendingCount, setPendingCount] = useState(0);

  // Load pending count
  useEffect(() => {
    if (isOpen) {
      loadPendingCount();
    }
  }, [isOpen]);

  const loadPendingCount = async () => {
    try {
      const data = await getPendingRequestsCount(getAuthHeader());
      setPendingCount(data.pending_count);
    } catch (err) {
      console.error("Error loading pending count:", err);
    }
  };

  const handleDataChange = () => {
    loadPendingCount();
    if (onDataChange) {
      onDataChange();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.panel}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerRight}>
            <span className={styles.headerIcon}>🔧</span>
            <h2 className={styles.headerTitle}>ניהול מערכת</h2>
          </div>
          <div className={styles.headerLeft}>
            <div className={styles.adminInfo}>
              <span className={styles.adminName}>{admin?.display_name || admin?.username}</span>
              <button className={styles.logoutBtn} onClick={logout}>
                יציאה
              </button>
            </div>
            <button className={styles.closeBtn} onClick={onClose}>
              ×
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className={styles.tabIcon}>{tab.icon}</span>
              <span className={styles.tabLabel}>{tab.label}</span>
              {tab.id === "requests" && pendingCount > 0 && (
                <span className={styles.badge}>{pendingCount}</span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className={styles.content}>
          {activeTab === "requests" && (
            <RequestsTab
              authHeader={getAuthHeader()}
              onDataChange={handleDataChange}
            />
          )}
          {activeTab === "permanent" && (
            <PermanentSitesTab
              authHeader={getAuthHeader()}
              onDataChange={handleDataChange}
            />
          )}
          {activeTab === "temporary" && (
            <TemporarySitesTab
              authHeader={getAuthHeader()}
              onDataChange={handleDataChange}
            />
          )}
        </div>
      </div>
    </>
  );
}

