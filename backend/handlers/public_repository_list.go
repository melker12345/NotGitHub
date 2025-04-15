package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github-clone/models"
)

// GetPublicRepositories handles retrieving all public repositories
// This handler doesn't require authentication
func GetPublicRepositories(w http.ResponseWriter, r *http.Request) {
	// Get optional pagination parameters
	limitStr := r.URL.Query().Get("limit")
	offsetStr := r.URL.Query().Get("offset")

	// Default values
	limit := 20
	offset := 0

	// Parse limit if provided
	if limitStr != "" {
		parsedLimit, err := strconv.Atoi(limitStr)
		if err == nil && parsedLimit > 0 {
			limit = parsedLimit
		}
	}

	// Parse offset if provided
	if offsetStr != "" {
		parsedOffset, err := strconv.Atoi(offsetStr)
		if err == nil && parsedOffset >= 0 {
			offset = parsedOffset
		}
	}

	// Get optional user ID for personalized results
	// If user is authenticated, we can show private repos they have access to
	userID := getUserIDOptional(r)

	// Get the repositories
	repos, err := models.GetPublicRepositories(limit, offset, userID)
	if err != nil {
		http.Error(w, "Failed to retrieve public repositories", http.StatusInternalServerError)
		return
	}

	// Return success response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(repos)
}

// GetUserPublicRepositories handles retrieving all public repositories for a specific user
func GetUserPublicRepositories(w http.ResponseWriter, r *http.Request) {
	// Get username from URL
	username := r.URL.Query().Get("username")
	if username == "" {
		http.Error(w, "Username is required", http.StatusBadRequest)
		return
	}

	// Get optional pagination parameters
	limitStr := r.URL.Query().Get("limit")
	offsetStr := r.URL.Query().Get("offset")

	// Default values
	limit := 20
	offset := 0

	// Parse limit if provided
	if limitStr != "" {
		parsedLimit, err := strconv.Atoi(limitStr)
		if err == nil && parsedLimit > 0 {
			limit = parsedLimit
		}
	}

	// Parse offset if provided
	if offsetStr != "" {
		parsedOffset, err := strconv.Atoi(offsetStr)
		if err == nil && parsedOffset >= 0 {
			offset = parsedOffset
		}
	}

	// Get optional user ID for personalized results
	// If user is authenticated and viewing their own profile, we can show private repos
	requestingUserID := getUserIDOptional(r)

	// Get the repositories
	repos, err := models.GetUserPublicRepositories(username, limit, offset, requestingUserID)
	if err != nil {
		http.Error(w, "Failed to retrieve user's public repositories", http.StatusInternalServerError)
		return
	}

	// Return success response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(repos)
}
