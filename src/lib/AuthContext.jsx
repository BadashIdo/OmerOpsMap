
import React, { createContext, useState, useContext, useEffect } from 'react';
import apiClient from '@/api/apiClient'; // Using the new apiClient
import { appParams } from '@/lib/app-params';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    setIsLoadingPublicSettings(true);
    setAuthError(null);

    // Mock public settings - we assume they are loaded successfully
    setAppPublicSettings({ id: 'mock-app-id', public_settings: {} });
    setIsLoadingPublicSettings(false);

    // Check if we should log in as admin based on URL
    if (appParams.login === 'admin') {
      console.log("Admin login detected from URL.");
      checkUserAuth();
    } else {
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  const checkUserAuth = async () => {
    setIsLoadingAuth(true);
    
    // Mock user authentication for admin
    const mockAdminUser = {
      id: 'admin-user',
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'admin' // Important for admin access
    };
    
    setUser(mockAdminUser);
    setIsAuthenticated(true);
    setIsLoadingAuth(false);
    
    // Add a token to the apiClient for future requests
    const mockToken = 'admin-secret-token';
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${mockToken}`;
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    
    // Clear the token from apiClient
    delete apiClient.defaults.headers.common['Authorization'];
    
    // Redirect to the homepage without the login parameter
    window.location.href = window.location.pathname; 
  };

  const navigateToLogin = () => {
    // To log in, the user just needs to add ?login=admin to the URL
    // We can simulate this by redirecting
    if (window.location.search.indexOf('login=admin') === -1) {
      window.location.href = `${window.location.pathname}?login=admin`;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      logout,
      navigateToLogin,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
