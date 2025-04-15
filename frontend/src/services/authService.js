import api from './api';

// Returns the token from localStorage (checks both keys for compatibility)
export function getToken() {
    return localStorage.getItem("authToken") || localStorage.getItem("token");
}

// Returns the refresh token from localStorage if available
export function getRefreshToken() {
    return localStorage.getItem("refreshToken");
}

// Checks if a JWT token is valid (not expired)
export function isTokenValid(token) {
    if (!token) return false;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp * 1000 > Date.now();
    } catch (e) {
        console.error("Error validating token:", e);
        return false;
    }
}

// Checks if a token is about to expire (within the next 5 minutes)
export function isTokenExpiringSoon(token) {
    if (!token) return true;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        // Check if token expires in less than 5 minutes (300000 ms)
        return payload.exp * 1000 < Date.now() + 300000;
    } catch (e) {
        console.error("Error checking token expiration:", e);
        return true;
    }
}

// Refresh the access token using the refresh token
export async function refreshToken() {
    try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
            throw new Error("No refresh token available");
        }
        
        const response = await api.post('/auth/refresh', { refreshToken });
        const { token } = response.data;
        
        if (!token) {
            throw new Error("No token received from refresh endpoint");
        }
        
        // Store the new token
        localStorage.setItem("authToken", token);
        return token;
    } catch (error) {
        console.error("Failed to refresh token:", error);
        // Clear all auth data on refresh failure
        localStorage.removeItem("authToken");
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        throw error;
    }
}

// Get user data from the token
export function getUserFromToken(token) {
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return { id: payload.user_id };
    } catch (e) {
        console.error("Error extracting user from token:", e);
        return null;
    }
}

