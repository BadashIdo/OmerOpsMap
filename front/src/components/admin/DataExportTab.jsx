import { useState } from "react";
import styles from "../../styles/AdminTab.module.css";

export default function DataExportTab({ authHeader }) {
    const [isExporting, setIsExporting] = useState(false);
    const [exportError, setExportError] = useState("");
    const [exportSuccess, setExportSuccess] = useState("");
    const [selectedTable, setSelectedTable] = useState("all");

    // API URL from environment
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8001";

    const handleExport = async () => {
        setIsExporting(true);
        setExportError("");
        setExportSuccess("");

        try {
            const response = await fetch(`${API_URL}/api/admin/export/database?table=${selectedTable}`, {
                method: "GET",
                headers: {
                    ...authHeader,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "שגיאה בייצוא הנתונים");
            }

            // Get filename from Content-Disposition header or use default
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = 'database_export.xlsx';
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
                if (filenameMatch) {
                    filename = filenameMatch[1];
                }
            }

            // Download the file
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            setExportSuccess("✅ הקובץ הורד בהצלחה!");

            // Clear success message after 3 seconds
            setTimeout(() => {
                setExportSuccess("");
            }, 3000);

        } catch (err) {
            setExportError(err.message || "שגיאה בייצוא הנתונים");
            console.error(err);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className={styles.tabContent}>
            <h2 style={{ marginBottom: "20px" }}>📤 ייצוא נתונים</h2>

            <div className={styles.infoBox}>
                <h3 style={{ marginTop: 0 }}>הורדת נתונים מותאמת</h3>
                <p style={{ lineHeight: "1.6", marginBottom: "15px" }}>
                    בחר איזו טבלה ברצונך לייצא מתוך מסד הנתונים:
                </p>

                <div style={{ marginBottom: "20px" }}>
                    <select
                        value={selectedTable}
                        onChange={(e) => setSelectedTable(e.target.value)}
                        className={styles.searchInput}
                        style={{ width: "100%", maxWidth: "400px", cursor: "pointer" }}
                    >
                        <option value="all">כל המערכת (גיבוי מלא בכל הלשוניות)</option>
                        <option value="permanent_sites">אתרים קבועים (Permanent Sites)</option>
                        <option value="temporary_sites">אירועים זמניים (Temporary Events)</option>
                        <option value="feedback">דיווחי משתמשים (Feedback)</option>
                        <option value="admins">מנהלי מערכת (Admins)</option>
                        <option value="external_features">שכבות חיצוניות מסונכרנות</option>
                        <option value="integration_runs">היסטוריית סנכרונים</option>
                    </select>
                </div>

                <div style={{ marginTop: "20px", display: "flex", justifyContent: "center" }}>
                    <button
                        className={`${styles.btn} ${styles.btnPrimary}`}
                        onClick={handleExport}
                        disabled={isExporting}
                        style={{
                            backgroundColor: "#2196F3",
                            color: "white",
                            padding: "12px 30px",
                            fontSize: "16px",
                            display: "flex",
                            alignItems: "center",
                            gap: "10px"
                        }}
                    >
                        {isExporting ? (
                            <>⏳ מעבד בקשה...</>
                        ) : (
                            <>📥 הורד קובץ Excel</>
                        )}
                    </button>
                </div>
            </div>

            {/* Export Success Message */}
            {exportSuccess && (
                <div className={styles.successBox}>
                    {exportSuccess}
                </div>
            )}

            {/* Export Error Message */}
            {exportError && (
                <div className={styles.errorBox}>
                    ❌ {exportError}
                </div>
            )}
        </div>
    );
}
