import { useEffect, useState } from "react";
import styles from "../styles/NotificationToast.module.css";

/**
 * Toast notification component for real-time updates
 */
export default function NotificationToast({ message, type = "info", duration = 5000, onClose }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(() => onClose?.(), 300); // Wait for animation
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  if (!visible) return null;

  const icons = {
    info: "ℹ️",
    success: "✅",
    warning: "⚠️",
    error: "❌",
    update: "🔄",
  };

  return (
    <div className={`${styles.toast} ${styles[type]} ${visible ? styles.show : ""}`}>
      <div className={styles.icon}>{icons[type] || icons.info}</div>
      <div className={styles.message}>{message}</div>
      <button className={styles.close} onClick={() => setVisible(false)}>
        ×
      </button>
    </div>
  );
}

