import { useState } from "react";
import styles from "../../styles/AdminTab.module.css";

export default function DataImportTab({ authHeader }) {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Preview state
  const [previewData, setPreviewData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  // Site type
  const [siteType, setSiteType] = useState("permanent"); // 'permanent' or 'temporary'

  // API URL from environment
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8001";

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (selectedFile) => {
    // Validate file type
    if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
      setError("נא להעלות קובץ Excel (.xlsx או .xls)");
      return;
    }

    setFile(selectedFile);
    setError("");
    setSuccessMessage("");
    setPreviewData(null);
    setShowPreview(false);
  };

  const handlePreview = async () => {
    if (!file) {
      setError("נא לבחור קובץ קודם");
      return;
    }

    setIsLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_URL}/api/admin/import/preview?site_type=${siteType}`, {
        method: "POST",
        headers: {
          ...authHeader,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "שגיאה בטעינת התצוגה המקדימה");
      }

      const data = await response.json();
      setPreviewData(data);
      setShowPreview(true);
    } catch (err) {
      setError(err.message || "שגיאה בטעינת התצוגה המקדימה");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError("נא לבחור קובץ קודם");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccessMessage("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(
        `${API_URL}/api/admin/import/execute?site_type=${siteType}`,
        {
          method: "POST",
          headers: {
            ...authHeader,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "שגיאה ביבוא הנתונים");
      }

      const data = await response.json();

      // Build success message
      let message = `✅ יבוא הושלם בהצלחה!\n\n`;
      message += `📊 סטטוס:\n`;
      message += `• אתרים שנוספו: ${data.sites_added}\n`;
      if (data.sites_deleted > 0) {
        message += `• אתרים שנמחקו: ${data.sites_deleted}\n`;
      }
      if (data.sites_skipped > 0) {
        message += `• אתרים שדולגו (כפולים): ${data.sites_skipped}\n`;
      }
      message += `• סה"כ אתרים במערכת: ${data.total_in_db}`;

      // Show success message briefly before refreshing
      setSuccessMessage(message);
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (err) {
      setError(err.message || "שגיאה ביבוא הנתונים");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className={styles.tabContent}>
      <h2 style={{ marginBottom: "20px" }}>📥 יבוא נתונים מExcel</h2>

      {/* Site Type Toggle */}
      <div style={{ marginBottom: "20px" }}>
        <label style={{ display: "block", marginBottom: "10px", fontWeight: "bold" }}>
          בחר סוג נתונים:
        </label>
        <div style={{ display: "flex", gap: "0", borderRadius: "8px", overflow: "hidden", border: "1px solid #ccc", width: "fit-content" }}>
          <button
            className={`${styles.typeBtn} ${siteType === "permanent" ? styles.typeBtnPerm : ""}`}
            onClick={() => { setSiteType("permanent"); setFile(null); setPreviewData(null); setShowPreview(false); setError(""); }}
          >
            📍 אתרים קבועים
          </button>
          <button
            className={`${styles.typeBtn} ${siteType === "temporary" ? styles.typeBtnTemp : ""}`}
            onClick={() => { setSiteType("temporary"); setFile(null); setPreviewData(null); setShowPreview(false); setError(""); }}
            style={{ borderRight: "1px solid #ccc" }}
          >
            ⚡ אירועים זמניים
          </button>
        </div>
      </div>

      {/* File Upload Area */}
      <div
        className={`${styles.uploadArea} ${dragActive ? styles.uploadAreaActive : ""}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div style={{ fontSize: "48px", marginBottom: "10px" }}>📁</div>
        <p style={{ fontSize: "16px", marginBottom: "10px" }}>
          גרור ושחרר קובץ Excel כאן
        </p>
        <p style={{ fontSize: "14px", color: "#666", marginBottom: "15px" }}>או</p>
        <label htmlFor="file-upload" className={styles.btn} style={{ cursor: "pointer" }}>
          בחר קובץ
        </label>
        <input
          id="file-upload"
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
        {file && (
          <div className={styles.successBox} style={{ marginTop: "15px", padding: "10px" }}>
            <strong>קובץ נבחר:</strong> {file.name}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <button
          className={styles.btn}
          onClick={handlePreview}
          disabled={!file || isLoading}
          style={{ flex: 1 }}
        >
          {isLoading ? "טוען..." : "👁️ תצוגה מקדימה"}
        </button>
        <button
          className={`${styles.btn} ${styles.btnPrimary}`}
          onClick={handleImport}
          disabled={!file || isLoading}
          style={{ flex: 1, backgroundColor: "#4CAF50", color: "white" }}
        >
          {isLoading ? "מייבא..." : "✅ יבא עכשיו"}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className={styles.errorBox}>
          ❌ {error}
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className={styles.successBox} style={{ whiteSpace: "pre-line" }}>
          {successMessage}
        </div>
      )}

      {/* Preview Data */}
      {showPreview && previewData && (
        <div className={styles.previewWrap}>
          <h3 style={{ marginBottom: "15px" }}>📊 תצוגה מקדימה</h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "20px" }}>
            <div className={styles.dataBox}>
              <div style={{ fontSize: "24px", fontWeight: "bold", color: "#1976d2" }}>
                {previewData.valid_sites}
              </div>
              <div style={{ fontSize: "14px", color: "#666" }}>אתרים תקינים בקובץ</div>
            </div>

            <div className={styles.dataBox}>
              <div style={{ fontSize: "24px", fontWeight: "bold", color: "#f57c00" }}>
                {previewData.errors.length}
              </div>
              <div style={{ fontSize: "14px", color: "#666" }}>שורות עם שגיאות</div>
            </div>

            <div className={styles.dataBox}>
              <div style={{ fontSize: "24px", fontWeight: "bold", color: "#388e3c" }}>
                {previewData.new_sites.length}
              </div>
              <div style={{ fontSize: "14px", color: "#666" }}>אתרים חדשים</div>
            </div>

            <div className={styles.dataBox}>
              <div style={{ fontSize: "24px", fontWeight: "bold", color: "#d32f2f" }}>
                {previewData.duplicate_sites.length}
              </div>
              <div style={{ fontSize: "14px", color: "#666" }}>כפולים (יידלגו)</div>
            </div>
          </div>

          <div className={styles.dataBox} style={{ marginBottom: "15px" }}>
            <strong>סטטוס נוכחי:</strong> {previewData.current_db_count} אתרים במערכת
          </div>

          {previewData.new_sites.length > 0 && (
            <div style={{ marginBottom: "15px" }}>
              <strong>אתרים חדשים (מדגם):</strong>
              <div className={styles.dataBox} style={{ maxHeight: "150px", overflow: "auto", padding: "10px", marginTop: "5px" }}>
                {previewData.new_sites.map((name, idx) => (
                  <div key={idx} style={{ padding: "5px 0", borderBottom: "1px solid #334155" }}>
                    ✅ {name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {previewData.duplicate_sites.length > 0 && (
            <div style={{ marginBottom: "15px" }}>
              <strong>אתרים כפולים (יידלגו בייבוא):</strong>
              <div className={styles.dataBox} style={{ maxHeight: "150px", overflow: "auto", padding: "10px", marginTop: "5px" }}>
                {previewData.duplicate_sites.map((name, idx) => (
                  <div key={idx} style={{ padding: "5px 0", borderBottom: "1px solid #334155" }}>
                    ⏭️ {name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {previewData.errors.length > 0 && (
            <div>
              <strong>שגיאות:</strong>
              <div className={styles.errorBox} style={{ maxHeight: "150px", overflow: "auto", padding: "10px", marginTop: "5px" }}>
                {previewData.errors.map((error, idx) => (
                  <div key={idx} style={{ padding: "5px 0", borderBottom: "1px solid #ffcdd2" }}>
                    {error}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className={styles.instructionsBox}>
        <h4 style={{ marginBottom: "10px" }}>📝 הוראות:</h4>
        <ol style={{ marginRight: "20px", lineHeight: "1.8" }}>
          <li>הכן קובץ Excel עם השדות הנדרשים</li>
          <li>העלה את הקובץ (גרור ושחרר או בחר)</li>
          <li>לחץ על "תצוגה מקדימה" לראות אילו אתרים חדשים יתווספו</li>
          <li>לחץ על "יבא עכשיו" לבצע את היבוא (אתרים קיימים יידלגו)</li>
        </ol>
      </div>
    </div>
  );
}
