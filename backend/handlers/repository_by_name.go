package handlers

import (
	"encoding/json"
	"net/http"

	"github-clone/models"

	"github.com/gorilla/mux"
)

// GetRepositoryByUsername handles retrieving a repository by username and repository name
func GetRepositoryByUsername(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	username := vars["username"]
	repoName := vars["reponame"]

	// Get the authenticated user ID, but don't require it
	userID, _ := getUserIDFromRequest(r)

	// Get the repository
	repo, err := models.GetRepositoryByUsernameAndName(username, repoName)
	if err != nil {
		http.Error(w, "Error retrieving repository", http.StatusInternalServerError)
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

// GetRepositoryContentsByUsername handles browsing repository content by username and repo name
func GetRepositoryContentsByUsername(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	username := vars["username"]
	repoName := vars["reponame"]

	// Get the authenticated user ID, but don't require it
	userID, _ := getUserIDFromRequest(r)

	// Get the repository
	repo, err := models.GetRepositoryByUsernameAndName(username, repoName)
	if err != nil {
		http.Error(w, "Error retrieving repository", http.StatusInternalServerError)
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

	// Delegate to the content handler
	r = mux.SetURLVars(r, map[string]string{"id": repo.ID})
	GetRepositoryContents(w, r)
}

// GetFileContentByUsername handles file content retrieval by username and repo name
func GetFileContentByUsername(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	username := vars["username"]
	repoName := vars["reponame"]

	// Get the authenticated user ID, but don't require it
	userID, _ := getUserIDFromRequest(r)

	// Get the repository
	repo, err := models.GetRepositoryByUsernameAndName(username, repoName)
	if err != nil {
		http.Error(w, "Error retrieving repository", http.StatusInternalServerError)
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

	// Delegate to the content handler
	r = mux.SetURLVars(r, map[string]string{"id": repo.ID})
	GetFileContent(w, r)
}

// GetCommitHistoryByUsername handles commit history retrieval by username and repo name
func GetCommitHistoryByUsername(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	username := vars["username"]
	repoName := vars["reponame"]

	// Get the authenticated user ID, but don't require it
	userID, _ := getUserIDFromRequest(r)

	// Get the repository
	repo, err := models.GetRepositoryByUsernameAndName(username, repoName)
	if err != nil {
		http.Error(w, "Error retrieving repository", http.StatusInternalServerError)
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

	// Delegate to the content handler
	r = mux.SetURLVars(r, map[string]string{"id": repo.ID})
	GetCommitHistory(w, r)
}

// UpdateRepositoryByUsername handles updating a repository by username and repository name
func UpdateRepositoryByUsername(w http.ResponseWriter, r *http.Request) {
	// Get the authenticated user ID from the token
	userID, err := getUserIDFromRequest(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	vars := mux.Vars(r)
	username := vars["username"]
	repoName := vars["reponame"]

	// Get the repository
	repo, err := models.GetRepositoryByUsernameAndName(username, repoName)
	if err != nil {
		http.Error(w, "Error retrieving repository", http.StatusInternalServerError)
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
	updatedRepo, err := models.UpdateRepository(repo.ID, input)
	if err != nil {
		http.Error(w, "Failed to update repository: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Return success response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(updatedRepo)
}

// DeleteRepositoryByUsername handles deleting a repository by username and repository name
func DeleteRepositoryByUsername(w http.ResponseWriter, r *http.Request) {
	// Get the authenticated user ID from the token
	userID, err := getUserIDFromRequest(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	vars := mux.Vars(r)
	username := vars["username"]
	repoName := vars["reponame"]

	// Get the repository
	repo, err := models.GetRepositoryByUsernameAndName(username, repoName)
	if err != nil {
		http.Error(w, "Error retrieving repository", http.StatusInternalServerError)
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
	err = models.DeleteRepository(repo.ID)
	if err != nil {
		http.Error(w, "Failed to delete repository: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Return success response
	w.WriteHeader(http.StatusNoContent)
}
