package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github-clone/auth"
	"github-clone/models"
	"github-clone/utils"
)

// In-memory user storage for demonstration purposes
// In a real application, we would use a database
var users = make(map[string]models.User)

// RegisterRequest is the format for registration requests
type RegisterRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

// LoginRequest is the format for login requests
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// AuthResponse is the format for authentication responses
type AuthResponse struct {
	Token string           `json:"token"`
	User  models.UserResponse `json:"user"`
}

// Register handles user registration
func Register(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	// Validate input
	if req.Username == "" || req.Email == "" || req.Password == "" {
		http.Error(w, "Username, email, and password are required", http.StatusBadRequest)
		return
	}

	// Check if user already exists by email
	for _, user := range users {
		if user.Email == req.Email {
			http.Error(w, "Email already in use", http.StatusConflict)
			return
		}
		if user.Username == req.Username {
			http.Error(w, "Username already taken", http.StatusConflict)
			return
		}
	}

	// Hash password
	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		http.Error(w, "Failed to process registration", http.StatusInternalServerError)
		return
	}

	// Create user
	now := time.Now()
	newUser := models.User{
		ID:        generateUserID(),
		Username:  req.Username,
		Email:     req.Email,
		Password:  hashedPassword,
		CreatedAt: now,
		UpdatedAt: now,
	}

	// Store user
	users[newUser.ID] = newUser

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

// Login handles user login
func Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	// Find user by email
	var foundUser models.User
	userFound := false
	for _, user := range users {
		if user.Email == req.Email {
			foundUser = user
			userFound = true
			break
		}
	}

	// Check if user exists and password is correct
	if !userFound || !utils.CheckPasswordHash(req.Password, foundUser.Password) {
		http.Error(w, "Invalid email or password", http.StatusUnauthorized)
		return
	}

	// Generate token
	token, err := auth.GenerateToken(foundUser.ID)
	if err != nil {
		http.Error(w, "Failed to generate authentication token", http.StatusInternalServerError)
		return
	}

	// Create response
	resp := AuthResponse{
		Token: token,
		User:  foundUser.ToResponse(),
	}

	// Return success response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

// Helper function to generate a simple user ID
// In a real app, we would use a more robust method
func generateUserID() string {
	return "user_" + time.Now().Format("20060102150405")
}
