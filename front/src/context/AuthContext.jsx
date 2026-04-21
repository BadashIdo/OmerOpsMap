import { createContext, useContext, useState, useEffect, useCallback } from "react";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

// Create context
const AuthContext = createContext(null);

// Storage keys
const TOKEN_KEY = "omeropsmap_token";
const ADMIN_KEY = "omeropsmap_admin";

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load token from sessionStorage on mount
  useEffect(() => {
    const storedToken = sessionStorage.getItem(TOKEN_KEY);
    const storedAdmin = sessionStorage.getItem(ADMIN_KEY);

    if (storedToken && storedAdmin) {
      setToken(storedToken);
      try {
        setAdmin(JSON.parse(storedAdmin));
      } catch (e) {
        console.error("Error parsing stored admin:", e);
      }
      // Verify token is still valid
      verifyToken(storedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  // Verify token with server
  const verifyToken = async (tokenToVerify) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${tokenToVerify}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAdmin(data.admin);
        sessionStorage.setItem(ADMIN_KEY, JSON.stringify(data.admin));
      } else {
        // Token is invalid, clear storage
        logout();
      }
    } catch (e) {
      console.error("Error verifying token:", e);
      // Keep token if network error (offline support)
    } finally {
      setIsLoading(false);
    }
  };

  // Login function
  const login = useCallback(async (username, password) => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        let message = "שגיאה בהתחברות";
        try {
          const data = await response.json();
          if (data.detail) message = data.detail;
        } catch {}
        throw new Error(message);
      }

      const data = await response.json();

      // Store in state
      setToken(data.access_token);
      setAdmin(data.admin);

      // Store in sessionStorage (clears when browser closes)
      sessionStorage.setItem(TOKEN_KEY, data.access_token);
      sessionStorage.setItem(ADMIN_KEY, JSON.stringify(data.admin));

      return true;
    } catch (e) {
      setError(e.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout function - also clears guest mode
  const logout = useCallback(() => {
    setToken(null);
    setAdmin(null);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(ADMIN_KEY);
    sessionStorage.removeItem("omeropsmap_guest"); // Clear guest mode
    window.location.reload(); // Force reload to show login page
  }, []);

  // Enter as guest (just sets isLoading to false)
  const enterAsGuest = useCallback(() => {
    setIsLoading(false);
    setAdmin(null);
    setToken(null);
  }, []);

  // Get auth header for API requests
  const getAuthHeader = useCallback(() => {
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
    return {};
  }, [token]);

  // Value to provide
  const value = {
    admin,
    token,
    isAdmin: !!admin,
    isLoading,
    error,
    setError, // Expose setError to allow clearing errors
    login,
    logout,
    enterAsGuest,
    getAuthHeader,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;

