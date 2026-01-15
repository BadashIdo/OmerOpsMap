import { useEffect, useState, useRef } from "react";
import styles from "../styles/NotificationToast.module.css";

/**
 * Toast notification component for real-time updates
 */
export default function NotificationToast({ message, type = "info", duration = 5000, onClose }) {
  const [visible, setVisible] = useState(true);

  // Use a ref for onClose to avoid resetting the timer on every render if onClose changes
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(() => onCloseRef.current?.(), 300); // Wait for animation
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]); // Removed onClose form dependency to prevent timer resets

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

