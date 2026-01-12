import { useState } from "react";
import styles from "../styles/LoginPage.module.css";

export default function LoginPage({
  showLoginForm: externalShowLoginForm,
  setShowLoginForm: externalSetShowLoginForm,
  username: externalUsername,
  setUsername: externalSetUsername,
  password: externalPassword,
  setPassword: externalSetPassword,
  localError: externalLocalError,
  error: externalError,
  isLoading: externalIsLoading,
  handleAdminLogin: externalHandleAdminLogin,
  handleGuestEntry: externalHandleGuestEntry,
}) {
  // Use internal state if props not provided (for loading state)
  const [internalShowLoginForm, setInternalShowLoginForm] = useState(false);
  const [internalUsername, setInternalUsername] = useState("");
  const [internalPassword, setInternalPassword] = useState("");
  
  const showLoginForm = externalShowLoginForm ?? internalShowLoginForm;
  const setShowLoginForm = externalSetShowLoginForm ?? setInternalShowLoginForm;
  const username = externalUsername ?? internalUsername;
  const setUsername = externalSetUsername ?? setInternalUsername;
  const password = externalPassword ?? internalPassword;
  const setPassword = externalSetPassword ?? setInternalPassword;
  const localError = externalLocalError ?? "";
  const error = externalError ?? "";
  const isLoading = externalIsLoading ?? true;
  const handleAdminLogin = externalHandleAdminLogin ?? (() => {});
  const handleGuestEntry = externalHandleGuestEntry ?? (() => {});

  if (isLoading && !externalHandleAdminLogin) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingBox}>
          <div className={styles.spinner}></div>
          <div>טוען...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* Logo and Title */}
        <div className={styles.header}>
          <div className={styles.logo}>🗺️</div>
          <h1 className={styles.title}>OmerOpsMap</h1>
          <p className={styles.subtitle}>מערכת ניהול עירונית</p>
        </div>

        {!showLoginForm ? (
          /* Initial choice screen */
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
              onClick={() => setShowLoginForm(true)}
            >
              <span className={styles.btnIcon}>🔐</span>
              <span className={styles.btnText}>כניסה כמנהל</span>
              <span className={styles.btnDesc}>ניהול אתרים ואישור בקשות</span>
            </button>
          </div>
        ) : (
          /* Admin login form */
          <form className={styles.loginForm} onSubmit={handleAdminLogin}>
            <h2 className={styles.formTitle}>התחברות מנהל</h2>

            {(localError || error) && (
              <div className={styles.error}>
                {localError || error}
              </div>
            )}

            <div className={styles.inputGroup}>
              <label htmlFor="username" className={styles.label}>
                שם משתמש
              </label>
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
              <label htmlFor="password" className={styles.label}>
                סיסמה
              </label>
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

            <button
              type="button"
              className={styles.backBtn}
              onClick={() => {
                setShowLoginForm(false);
                setLocalError("");
                setUsername("");
                setPassword("");
              }}
            >
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

