package utils

import (
	"database/sql"
	"errors"
	"net/http"
	"strings"
	
	"github-clone/auth"
	"github-clone/config"
)

// CurrentUser represents the currently authenticated user
type CurrentUser struct {
	ID       string
	Username string
}

// GetUserFromContext extracts the user from the Authorization header
func GetUserFromContext(r *http.Request) (*CurrentUser, error) {
	// Get the Authorization header
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		return nil, errors.New("authorization header is required")
	}
	
	// Check if it starts with "Bearer "
	if !strings.HasPrefix(authHeader, "Bearer ") {
		return nil, errors.New("authorization header must be Bearer token")
	}
	
	// Extract the token
	tokenString := strings.TrimPrefix(authHeader, "Bearer ")
	
	// Validate the token
	claims, err := auth.ValidateToken(tokenString)
	if err != nil {
		return nil, errors.New("invalid token")
	}
	
	// Get the user from the database
	var username string
	err = config.DB.QueryRow("SELECT username FROM users WHERE id = ?", claims.UserID).Scan(&username)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("user not found")
		}
		return nil, err
	}
	
	// Return the current user
	return &CurrentUser{
		ID:       claims.UserID,
		Username: username,
	}, nil
}
