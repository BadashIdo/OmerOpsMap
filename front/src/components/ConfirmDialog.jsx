import styles from "../styles/ConfirmDialog.module.css";

/**
 * Reusable in-app confirmation dialog. Replaces the browser's native
 * `confirm()` which is silently suppressed once a user blocks dialogs
 * for the origin (and never visible at all in some embedded contexts).
 *
 * Renders nothing when `open` is false.
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "אישור",
  cancelLabel = "ביטול",
  confirmVariant = "primary",
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  const confirmClass = confirmVariant === "danger" ? styles.danger : styles.primary;

  return (
    <>
      <div className={styles.overlay} onClick={onCancel} />
      <div className={styles.box} role="dialog" aria-modal="true">
        {title && <h3 className={styles.title}>{title}</h3>}
        <p className={styles.message}>{message}</p>
        <div className={styles.actions}>
          <button type="button" className={styles.cancelBtn} onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className={confirmClass} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </>
  );
}
