package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github-clone/models"
	"github-clone/utils"

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
	
	// Log the request for debugging
	fmt.Printf("Accessing repo contents: %s/%s\n", username, repoName)

	// Get the authenticated user ID, but don't require it for public repositories
	userID := getUserIDOptional(r)

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

	// Get the path from query parameters
	path := r.URL.Query().Get("path")
	if path == "" {
		path = "/"
	}

	// Clean the path to prevent directory traversal
	path = strings.TrimPrefix(path, "/")
	path = strings.Trim(path, ".")

	// Get the ref (branch, tag, commit) from query parameters
	ref := r.URL.Query().Get("ref")
	if ref == "" {
		ref = "HEAD" // Default to HEAD
	}
	
	// Get the repository path on the filesystem using username-based path
	baseRepoPath := os.Getenv("REPOSITORIES_PATH")
	if baseRepoPath == "" {
		// Default to a subdirectory in the current working directory
		dir, _ := os.Getwd()
		baseRepoPath = filepath.Join(dir, "repositories")
	}
	
	// Format Git repository path - username/repo.git
	gitRepoName := repoName
	if !strings.HasSuffix(gitRepoName, ".git") {
		gitRepoName += ".git"
	}
	
	// Use username-based path to match SSH server path structure
	repoPath := filepath.Join(baseRepoPath, username, gitRepoName)

	// Get the contents
	contents, err := utils.GetRepositoryContents(repoPath, path, ref)
	if err != nil {
		http.Error(w, "Error retrieving repository contents: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Return the contents as JSON
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(contents)
}

// GetFileContentByUsername handles file content retrieval by username and repo name
func GetFileContentByUsername(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	username := vars["username"]
	repoName := vars["reponame"]

	// Get the authenticated user ID, but don't require it for public repositories
	userID := getUserIDOptional(r)

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

	// Get the file path from query parameters
	filePath := r.URL.Query().Get("path")
	if filePath == "" {
		http.Error(w, "File path is required", http.StatusBadRequest)
		return
	}

	// Clean the path to prevent directory traversal
	filePath = strings.TrimPrefix(filePath, "/")
	filePath = strings.Trim(filePath, ".")

	// Get the ref (branch, tag, commit) from query parameters
	ref := r.URL.Query().Get("ref")
	if ref == "" {
		ref = "HEAD" // Default to HEAD
	}
	
	// Get the repository path on the filesystem using username-based path
	baseRepoPath := os.Getenv("REPOSITORIES_PATH")
	if baseRepoPath == "" {
		// Default to a subdirectory in the current working directory
		dir, _ := os.Getwd()
		baseRepoPath = filepath.Join(dir, "repositories")
	}
	
	// Format Git repository path - username/repo.git
	gitRepoName := repoName
	if !strings.HasSuffix(gitRepoName, ".git") {
		gitRepoName += ".git"
	}
	
	// Use username-based path to match SSH server path structure
	repoPath := filepath.Join(baseRepoPath, username, gitRepoName)

	// Get the file content
	fileEntry, err := utils.GetFileContent(repoPath, filePath, ref)
	if err != nil {
		http.Error(w, "Error retrieving file content: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Return the file content as JSON
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(fileEntry)
}

// GetCommitHistoryByUsername handles commit history retrieval by username and repo name
func GetCommitHistoryByUsername(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	username := vars["username"]
	repoName := vars["reponame"]

	// Get the authenticated user ID, but don't require it for public repositories
	userID := getUserIDOptional(r)

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

	// Get the ref (branch, tag, commit) from query parameters
	ref := r.URL.Query().Get("ref")
	if ref == "" {
		ref = "HEAD" // Default to HEAD
	}

	// Get the limit parameter
	limit := 10 // Default to 10 commits
	if limitParam := r.URL.Query().Get("limit"); limitParam != "" {
		if _, err := json.Number(limitParam).Int64(); err == nil {
			json.Unmarshal([]byte(limitParam), &limit)
		}
	}
	
	// Get the repository path on the filesystem using username-based path
	baseRepoPath := os.Getenv("REPOSITORIES_PATH")
	if baseRepoPath == "" {
		// Default to a subdirectory in the current working directory
		dir, _ := os.Getwd()
		baseRepoPath = filepath.Join(dir, "repositories")
	}
	
	// Format Git repository path - username/repo.git
	gitRepoName := repoName
	if !strings.HasSuffix(gitRepoName, ".git") {
		gitRepoName += ".git"
	}
	
	// Use username-based path to match SSH server path structure
	repoPath := filepath.Join(baseRepoPath, username, gitRepoName)

	// Get the commit history
	commits, err := utils.GetCommitHistory(repoPath, ref, limit)
	if err != nil {
		http.Error(w, "Error retrieving commit history: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Return the commit history as JSON
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(commits)
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
