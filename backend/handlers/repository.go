package handlers

import (
	"encoding/json"
	"net/http"

	"github-clone/auth"
	"github-clone/models"

	"github.com/gorilla/mux"
)

// CreateRepository handles creating a new repository
func CreateRepository(w http.ResponseWriter, r *http.Request) {
	// Get the authenticated user ID from the token
	userID, err := getUserIDFromRequest(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Parse the request body
	var input models.RepositoryInput
	err = json.NewDecoder(r.Body).Decode(&input)
	if err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	// Validate input
	if input.Name == "" {
		http.Error(w, "Repository name is required", http.StatusBadRequest)
		return
	}

	// Check if the user already has a repository with this name
	existingRepo, err := models.GetRepositoryByOwnerAndName(userID, input.Name)
	if err != nil {
		http.Error(w, "Server error checking repository existence", http.StatusInternalServerError)
		return
	}
	if existingRepo != nil {
		http.Error(w, "You already have a repository with this name", http.StatusConflict)
		return
	}

	// Create the repository
	repo, err := models.CreateRepository(userID, input)
	if err != nil {
		http.Error(w, "Failed to create repository: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Return success response
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(repo)
}

// GetUserRepositories handles retrieving all repositories owned by a user
func GetUserRepositories(w http.ResponseWriter, r *http.Request) {
	// Get the authenticated user ID from the token
	userID, err := getUserIDFromRequest(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Get the repositories
	repos, err := models.GetUserRepositories(userID)
	if err != nil {
		http.Error(w, "Failed to retrieve repositories", http.StatusInternalServerError)
		return
	}

	// Return success response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(repos)
}

// GetRepository handles retrieving a specific repository by ID
func GetRepository(w http.ResponseWriter, r *http.Request) {
	// Get the authenticated user ID from the token
	userID, err := getUserIDFromRequest(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Get the repository ID from the URL
	vars := mux.Vars(r)
	repoID := vars["id"]

	// Get the repository
	repo, err := models.GetRepositoryByID(repoID)
	if err != nil {
		http.Error(w, "Failed to retrieve repository", http.StatusInternalServerError)
		return
	}

	if repo == nil {
		http.Error(w, "Repository not found", http.StatusNotFound)
		return
	}

	// Check if user has access to this repository
	if repo.OwnerID != userID && !repo.IsPublic {
		http.Error(w, "You don't have access to this repository", http.StatusForbidden)
		return
	}

	// Return success response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(repo)
}

// UpdateRepository handles updating an existing repository
func UpdateRepository(w http.ResponseWriter, r *http.Request) {
	// Get the authenticated user ID from the token
	userID, err := getUserIDFromRequest(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Get the repository ID from the URL
	vars := mux.Vars(r)
	repoID := vars["id"]

	// Get the existing repository
	repo, err := models.GetRepositoryByID(repoID)
	if err != nil {
		http.Error(w, "Failed to retrieve repository", http.StatusInternalServerError)
		return
	}

	if repo == nil {
		http.Error(w, "Repository not found", http.StatusNotFound)
		return
	}

	// Check if user is the owner
	if repo.OwnerID != userID {
		http.Error(w, "You don't have permission to update this repository", http.StatusForbidden)
		return
	}

	// Parse the request body
	var input models.RepositoryInput
	err = json.NewDecoder(r.Body).Decode(&input)
	if err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	// Validate input
	if input.Name == "" {
		http.Error(w, "Repository name is required", http.StatusBadRequest)
		return
	}

	// Update the repository
	updatedRepo, err := models.UpdateRepository(repoID, input)
	if err != nil {
		http.Error(w, "Failed to update repository: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Return success response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(updatedRepo)
}

// DeleteRepository handles deleting a repository
func DeleteRepository(w http.ResponseWriter, r *http.Request) {
	// Get the authenticated user ID from the token
	userID, err := getUserIDFromRequest(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Get the repository ID from the URL
	vars := mux.Vars(r)
	repoID := vars["id"]

	// Get the existing repository
	repo, err := models.GetRepositoryByID(repoID)
	if err != nil {
		http.Error(w, "Failed to retrieve repository", http.StatusInternalServerError)
		return
	}

	if repo == nil {
		http.Error(w, "Repository not found", http.StatusNotFound)
		return
	}

	// Check if user is the owner
	if repo.OwnerID != userID {
		http.Error(w, "You don't have permission to delete this repository", http.StatusForbidden)
		return
	}

	// Delete the repository
	err = models.DeleteRepository(repoID)
	if err != nil {
		http.Error(w, "Failed to delete repository: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Return success response
	w.WriteHeader(http.StatusNoContent)
}

// Helper function to extract user ID from the request token
func getUserIDFromRequest(r *http.Request) (string, error) {
	// Get the token from the Authorization header
	tokenString := r.Header.Get("Authorization")
	if tokenString == "" {
		return "", auth.ErrInvalidToken
	}

	// Remove "Bearer " prefix if present
	if len(tokenString) > 7 && tokenString[:7] == "Bearer " {
		tokenString = tokenString[7:]
	}

	// Validate the token and extract the claims
	claims, err := auth.ValidateToken(tokenString)
	if err != nil {
		return "", err
	}

	return claims.UserID, nil
}
