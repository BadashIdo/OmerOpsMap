import { useState } from "react";
import styles from "../../styles/AdminTab.module.css";

export default function DataExportTab({ authHeader }) {
    const [isExporting, setIsExporting] = useState(false);
    const [exportError, setExportError] = useState("");
    const [exportSuccess, setExportSuccess] = useState("");

    // API URL from environment
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8001";

    const handleExport = async () => {
        setIsExporting(true);
        setExportError("");
        setExportSuccess("");

        try {
            const response = await fetch(`${API_URL}/api/admin/export/database`, {
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

            <div style={{ padding: "15px", backgroundColor: "#e3f2fd", borderRadius: "8px", border: "1px solid #90caf9", maxWidth: "600px" }}>
                <h3 style={{ marginTop: 0, color: "#1976D2" }}>הורדת גיבוי מלא</h3>
                <p style={{ lineHeight: "1.6" }}>
                    פעולה זו תוריד קובץ Excel המכיל את כל הנתונים השמורים במערכת, כולל:
                </p>
                <ul style={{ lineHeight: "1.6", marginRight: "20px" }}>
                    <li>אתרים קבועים (Permanent Sites)</li>
                    <li>אירועים זמניים (Temporary Events)</li>
                </ul>

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
                <div style={{ padding: "15px", backgroundColor: "#e8f5e9", color: "#2e7d32", borderRadius: "5px", marginTop: "20px", maxWidth: "600px" }}>
                    {exportSuccess}
                </div>
            )}

            {/* Export Error Message */}
            {exportError && (
                <div style={{ padding: "15px", backgroundColor: "#ffebee", color: "#c62828", borderRadius: "5px", marginTop: "20px", maxWidth: "600px" }}>
                    ❌ {exportError}
                </div>
            )}
        </div>
    );
}
