import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { 
  isTokenValid, 
  getToken, 
  getRefreshToken,
  isTokenExpiringSoon, 
  refreshToken,
  getUserFromToken 
} from "../services/authService";
import api from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [tokenRefreshInProgress, setTokenRefreshInProgress] = useState(false);

  // Function to handle token refresh
  const handleTokenRefresh = useCallback(async () => {
    try {
      if (tokenRefreshInProgress) return;
      setTokenRefreshInProgress(true);
      
      const token = getToken();
      // Only try to refresh if we have a token that's expiring soon
      if (token && isTokenExpiringSoon(token) && getRefreshToken()) {
        console.log("Token is expiring soon, attempting refresh");
        const newToken = await refreshToken();
        if (newToken && isTokenValid(newToken)) {
          console.log("Token refreshed successfully");
          // Update user from the new token
          const userData = getUserFromToken(newToken);
          if (userData) {
            setUser(userData);
          }
          setIsAuthenticated(true);
          setAuthError(null);
        } else {
          console.error("Received invalid token during refresh");
          handleLogout();
          setAuthError("Session expired. Please log in again.");
        }
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
      handleLogout();
      setAuthError("Session expired. Please log in again.");
    } finally {
      setTokenRefreshInProgress(false);
    }
  }, [tokenRefreshInProgress]);

  // Check authentication status on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        setLoading(true);
        const token = getToken();
        
        if (!token) {
          setIsAuthenticated(false);
          setUser(null);
          return;
        }
        
        if (isTokenValid(token)) {
          // Get user info from token or localStorage
          const userData = getUserFromToken(token) || JSON.parse(localStorage.getItem("user") || "null");
          setUser(userData);
          setIsAuthenticated(true);
          
          // Check if token needs refresh
          if (isTokenExpiringSoon(token)) {
            await handleTokenRefresh();
          }
        } else {
          // Token is invalid, try to refresh it
          try {
            if (getRefreshToken()) {
              await handleTokenRefresh();
            } else {
              // No refresh token, just log out
              handleLogout();
            }
          } catch (refreshError) {
            console.error("Error during token refresh:", refreshError);
            handleLogout();
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        handleLogout();
        setAuthError("Authentication error. Please log in again.");
      } finally {
        setLoading(false);
      }
    };
    
    initAuth();
    
    // Set up periodic token refresh (every 4 minutes)
    const refreshInterval = setInterval(() => {
      const token = getToken();
      if (token && isTokenExpiringSoon(token)) {
        handleTokenRefresh();
      }
    }, 4 * 60 * 1000); // 4 minutes
    
    return () => clearInterval(refreshInterval);
  }, [handleTokenRefresh]);

  // Handle login with optional remember me
  const login = (token, refreshTokenValue = null, rememberMe = false) => {
    try {
      if (!token || !isTokenValid(token)) {
        setAuthError("Invalid authentication token");
        return false;
      }
      
      localStorage.setItem("authToken", token);
      
      // Store refresh token if provided
      if (refreshTokenValue) {
        localStorage.setItem("refreshToken", refreshTokenValue);
      }
      
      // CRITICAL: Get the user data from localStorage that was just set by the LoginPage
      // This ensures we have the full user object including username
      const storedUserStr = localStorage.getItem("user");
      let userData;
      
      if (storedUserStr) {
        try {
          userData = JSON.parse(storedUserStr);
          console.log("AUTH CONTEXT: Using complete user data from localStorage:", userData);
          
          // Directly update the user state with the full user object
          setUser(userData);
        } catch (e) {
          console.error("Error parsing stored user data:", e);
          // Fall back to token data
          userData = getUserFromToken(token);
          setUser(userData);
        }
      } else {
        // No stored user data, extract what we can from the token
        userData = getUserFromToken(token);
        // Save this data for future use
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
      }
      
      // Update authentication state
      setIsAuthenticated(true);
      setAuthError(null);
      
      // Additional debug log to confirm state updates
      console.log("AUTH CONTEXT: Authentication complete, user state updated");
      
      return true;
    } catch (error) {
      console.error("Login error:", error);
      setAuthError("Login failed. Please try again.");
      return false;
    }
  };

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    setIsAuthenticated(false);
    setUser(null);
  };

  // Clear any auth errors
  const clearAuthError = () => {
    setAuthError(null);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated, 
        loading, 
        user, 
        login, 
        logout: handleLogout, 
        authError,
        clearAuthError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
