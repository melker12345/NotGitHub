// Returns the token from localStorage (checks both keys for compatibility)
export function getToken() {
    return localStorage.getItem("authToken") || localStorage.getItem("token");
}

// Checks if a JWT token is valid (not expired)
export function isTokenValid(token) {
    if (!token) return false;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp * 1000 > Date.now();
    } catch (e) {
        return false;
    }
}

