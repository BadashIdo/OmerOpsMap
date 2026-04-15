/**
 * useNotifications — manages the in-app toast notification list and admin badge count.
 *
 * Notifications are ephemeral (not persisted across page loads) and auto-dismiss
 * after a timeout defined inside NotificationToast.
 *
 * pendingCount drives the red badge on the admin panel button and is incremented /
 * decremented by WebSocket events in MapPage.
 *
 * @returns {{ notifications, addNotification, removeNotification, pendingCount, setPendingCount }}
 */

import { useState, useCallback } from "react";

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);

  /**
   * Add a toast notification.
   * @param {string} message - Text to display
   * @param {"info"|"success"|"warning"|"error"|"update"} type
   */
  const addNotification = useCallback((message, type = "info") => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type }]);
  }, []);

  /**
   * Remove a notification by its id.
   * Called automatically by NotificationToast when it expires or is dismissed.
   * @param {number} id
   */
  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return {
    notifications,
    addNotification,
    removeNotification,
    pendingCount,
    setPendingCount,
  };
}
