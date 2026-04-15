/**
 * AppRouter — decides which top-level screen to render based on auth state.
 *
 * Routing logic:
 *  1. Auth still loading (verifying existing token) → LoginPage (shows spinner)
 *  2. No admin session AND not entered as guest     → LoginPage (choice screen)
 *  3. Admin session OR guest mode                   → MapPage
 *
 * Guest mode is stored in sessionStorage so a page refresh keeps the user
 * inside the app without forcing them through the login screen again.
 * It is cleared on logout (AuthContext.logout calls sessionStorage.clear).
 */

import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import LoginPage from "../components/LoginPage";
import MapPage from "../pages/MapPage";

export default function AppRouter() {
  const { admin, isLoading } = useAuth();

  // Initialise from sessionStorage so a refresh preserves guest mode
  const [hasEnteredAsGuest, setHasEnteredAsGuest] = useState(
    () => sessionStorage.getItem("omeropsmap_guest") === "true"
  );

  const handleGuestEntry = () => {
    sessionStorage.setItem("omeropsmap_guest", "true");
    setHasEnteredAsGuest(true);
  };

  // Still verifying token on startup — LoginPage renders the spinner itself
  if (isLoading) return <LoginPage onGuestEntry={handleGuestEntry} />;

  // Not authenticated and not guest → show entry/login screen
  if (!admin && !hasEnteredAsGuest) {
    return <LoginPage onGuestEntry={handleGuestEntry} />;
  }

  // Authenticated (admin) or guest — show the main map application
  return <MapPage />;
}
