import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import PermanentSitesTab from "./admin/PermanentSitesTab";
import TemporarySitesTab from "./admin/TemporarySitesTab";
import DataImportTab from "./admin/DataImportTab";
import DataExportTab from "./admin/DataExportTab";
import styles from "../styles/AdminPanel.module.css";

const TABS = [
  { id: "permanent", label: "אתרים קבועים", icon: "📍" },
  { id: "temporary", label: "אירועים זמניים", icon: "⚡" },
  { id: "import", label: "יבוא נתונים", icon: "📤" },
  { id: "export", label: "ייצוא נתונים", icon: "📥" },
];

export default function AdminPanel({ isOpen, onClose, onDataChange, categoriesStructure }) {
  const { admin, logout, getAuthHeader } = useAuth();
  const [activeTab, setActiveTab] = useState("permanent");

  const handleDataChange = () => {
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
            </button>
          ))}
        </div>

        {/* Content */}
        <div className={styles.content}>
          {activeTab === "permanent" && (
            <PermanentSitesTab
              authHeader={getAuthHeader()}
              onDataChange={handleDataChange}
              categoriesStructure={categoriesStructure}
            />
          )}
          {activeTab === "temporary" && (
            <TemporarySitesTab
              authHeader={getAuthHeader()}
              onDataChange={handleDataChange}
              categoriesStructure={categoriesStructure}
            />
          )}
          {activeTab === "import" && (
            <DataImportTab
              authHeader={getAuthHeader()}
            />
          )}
          {activeTab === "export" && (
            <DataExportTab
              authHeader={getAuthHeader()}
            />
          )}
        </div>
      </div>
    </>
  );
}

