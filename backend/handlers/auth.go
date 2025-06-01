package handlers

import (
	"encoding/json"
	"net/http"

	"github-clone/auth"
	"github-clone/models"
	"github-clone/utils"
)

type RegisterRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type GitAccessTokenResponse struct {
	GitAccessToken string `json:"git_access_token"`
}

type AuthResponse struct {
	Token string             `json:"token"`
	User  models.UserResponse `json:"user"`
}

// Registration of users
func Register(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}
    // Check validity of request
	if req.Username == "" || req.Email == "" || req.Password == "" {
		http.Error(w, "Username, email, and password are required", http.StatusBadRequest)
		return
	}

	existingUser, err := models.GetUserByEmail(req.Email)
	if err != nil {
		http.Error(w, "Server error checking user existence", http.StatusInternalServerError)
		return
	}
	if existingUser != nil {
		http.Error(w, "Email already in use", http.StatusConflict)
		return
	}

	userByUsername, err := models.GetUserByUsername(req.Username)
	if err != nil {
		http.Error(w, "Server error checking username", http.StatusInternalServerError)
		return
	}
	if userByUsername != nil {
		http.Error(w, "Username already taken", http.StatusConflict)
		return
	}

	// Hash password
	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		http.Error(w, "Failed to process registration", http.StatusInternalServerError)
		return
	}

	// Create user in database
	newUser, err := models.CreateUser(req.Username, req.Email, hashedPassword)
	if err != nil {
		http.Error(w, "Failed to create user", http.StatusInternalServerError)
		return
	}

	// Generate token
	token, err := auth.GenerateToken(newUser.ID)
	if err != nil {
		http.Error(w, "Failed to generate authentication token", http.StatusInternalServerError)
		return
	}

	// Create response
	resp := AuthResponse{
		Token: token,
		User:  newUser.ToResponse(),
	}

	// Return success response
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(resp)
}

// User login
func Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	user, err := models.GetUserByEmail(req.Email)
	if err != nil {
		http.Error(w, "Server error during login", http.StatusInternalServerError)
		return
	}

	// password matching
	if user == nil || !utils.CheckPasswordHash(req.Password, user.Password) {
		http.Error(w, "Invalid email or password", http.StatusUnauthorized)
		return
	}

	// token
	token, err := auth.GenerateToken(user.ID)
	if err != nil {
		http.Error(w, "Failed to generate authentication token", http.StatusInternalServerError)
		return
	}

	resp := AuthResponse{
		Token: token,
		User:  user.ToResponse(),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

// GenerateGitAccessTokenHandler creates a new long-lived token for Git access
func GenerateGitAccessTokenHandler(w http.ResponseWriter, r *http.Request) {
	// Assume userID is set in the request context by an auth middleware
	userIDVal := r.Context().Value("userID") // Use your actual context key here
	userID, ok := userIDVal.(string)
	if !ok || userID == "" {
		http.Error(w, "User not authenticated or userID not found in context", http.StatusUnauthorized)
		return
	}

	// Generate a long-lived token (e.g., for 1 year)
	// The '1' here represents 1 year. You can make this configurable if needed.
	gitToken, err := auth.GenerateLongLivedToken(userID, 1)
	if err != nil {
		http.Error(w, "Failed to generate Git access token", http.StatusInternalServerError)
		return
	}

	resp := GitAccessTokenResponse{
		GitAccessToken: gitToken,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(resp)
}
