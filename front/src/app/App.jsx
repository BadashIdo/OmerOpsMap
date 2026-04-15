/**
 * App — root component.
 *
 * Wraps the entire application in AuthProvider so every component in the
 * tree can access authentication state via useAuth().
 *
 * Which screen to show (login vs map) is decided by AppRouter.
 * All business logic and data fetching lives in MapPage and its hooks.
 */

import { AuthProvider } from "../context/AuthContext";
import AppRouter from "./AppRouter";

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
