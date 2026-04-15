/**
 * LoginPage — entry screen shown when no valid session exists.
 *
 * Two modes controlled by local state:
 *  1. Choice screen  → "Enter as guest" or "Admin login" buttons
 *  2. Login form     → admin username + password form
 *
 * Reads auth state directly from AuthContext (via useAuth) instead of
 * receiving 10+ props from a parent wrapper — self-contained by design.
 *
 * Props:
 *  onGuestEntry — called after the user chooses to enter as guest,
 *                 so AppRouter can persist the choice to sessionStorage.
 */

import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import styles from "../styles/LoginPage.module.css";

export default function LoginPage({ onGuestEntry }) {
  const { login, enterAsGuest, isLoading, error, setError } = useAuth();

  const [showLoginForm, setShowLoginForm] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState("");

  // Show a spinner while AuthContext is verifying an existing token on startup
  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingBox}>
          <div className={styles.spinner}></div>
          <div>טוען...</div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    clearErrors("");
    if (!username.trim()) { setLocalError("נא להזין שם משתמש"); return; }
    if (!password)         { setLocalError("נא להזין סיסמה");    return; }

    const success = await login(username.trim(), password);
    // On failure keep the form open so the user can retry
    if (!success) setLocalError(error || "שגיאה בהתחברות");
  };

  const handleGuestEntry = () => {
    enterAsGuest();
    onGuestEntry?.();
  };

  /** Clear both local field error and any global error from AuthContext. */
  const clearErrors = (val) => {
    setLocalError(val);
    if (!val) setError(null);
  };

  const goBackToChoice = () => {
    setShowLoginForm(false);
    clearErrors("");
    setUsername("");
    setPassword("");
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* Logo and title */}
        <div className={styles.header}>
          <div className={styles.logo}>🗺️</div>
          <h1 className={styles.title}>OmerOpsMap</h1>
          <p className={styles.subtitle}>מערכת ניהול עירונית</p>
        </div>

        {!showLoginForm ? (
          /* ── Choice screen ── */
          <div className={styles.buttonGroup}>
            <button
              className={`${styles.btn} ${styles.guestBtn}`}
              onClick={handleGuestEntry}
            >
              <span className={styles.btnIcon}>👤</span>
              <span className={styles.btnText}>כניסה כאורח</span>
              <span className={styles.btnDesc}>צפייה במפה ודיווח על אירועים</span>
            </button>

            <button
              className={`${styles.btn} ${styles.adminBtn}`}
              onClick={() => { setShowLoginForm(true); clearErrors(""); }}
            >
              <span className={styles.btnIcon}>🔐</span>
              <span className={styles.btnText}>כניסה כמנהל</span>
              <span className={styles.btnDesc}>ניהול אתרים ואישור בקשות</span>
            </button>
          </div>
        ) : (
          /* ── Admin login form ── */
          <form className={styles.loginForm} onSubmit={handleAdminLogin}>
            <h2 className={styles.formTitle}>התחברות מנהל</h2>

            {(localError || error) && (
              <div className={styles.error}>{localError || error}</div>
            )}

            <div className={styles.inputGroup}>
              <label htmlFor="username" className={styles.label}>שם משתמש</label>
              <input
                id="username"
                type="text"
                className={styles.input}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="הזן שם משתמש"
                autoComplete="username"
                disabled={isLoading}
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="password" className={styles.label}>סיסמה</label>
              <input
                id="password"
                type="password"
                className={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="הזן סיסמה"
                autoComplete="current-password"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              className={`${styles.btn} ${styles.submitBtn}`}
              disabled={isLoading}
            >
              {isLoading ? "מתחבר..." : "התחבר"}
            </button>

            <button type="button" className={styles.backBtn} onClick={goBackToChoice}>
              ← חזרה
            </button>
          </form>
        )}

        <div className={styles.footer}>
          <span>עומר • מערכת ניהול עירונית</span>
        </div>
      </div>
    </div>
  );
}
