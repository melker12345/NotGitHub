package handlers

import (
	"encoding/json"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github-clone/models"
	"github-clone/utils"

	"github.com/gorilla/mux"
)

// GetRepositoryContents handles requests to browse repository content
func GetRepositoryContents(w http.ResponseWriter, r *http.Request) {
	// Get the repository ID from the URL
	vars := mux.Vars(r)
	repoID := vars["id"]

	// Get the authenticated user ID, but don't require it for public repositories
	userID := getUserIDOptional(r)

	// Get the repository
	repo, err := models.GetRepositoryByID(repoID)
	if err != nil {
		http.Error(w, "Error retrieving repository", http.StatusInternalServerError)
		return
	}

	if repo == nil {
		http.Error(w, "Repository not found", http.StatusNotFound)
		return
	}

	// Check if the user has access to this repository
	if repo.OwnerID != userID && !repo.IsPublic {
		// Only allow access if the user is the owner or the repository is public
		http.Error(w, "Access denied", http.StatusForbidden)
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
	gitRepoName := repo.Name
	if !strings.HasSuffix(gitRepoName, ".git") {
		gitRepoName += ".git"
	}
	
	// Use username-based path to match SSH server path structure
	repoPath := filepath.Join(baseRepoPath, repo.Owner.Username, gitRepoName)

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

// GetFileContent handles requests to view file content
func GetFileContent(w http.ResponseWriter, r *http.Request) {
	// Get the repository ID from the URL
	vars := mux.Vars(r)
	repoID := vars["id"]

	// Get the authenticated user ID, but don't require it for public repositories
	userID := getUserIDOptional(r)

	// Get the repository
	repo, err := models.GetRepositoryByID(repoID)
	if err != nil {
		http.Error(w, "Error retrieving repository", http.StatusInternalServerError)
		return
	}

	if repo == nil {
		http.Error(w, "Repository not found", http.StatusNotFound)
		return
	}

	// Check if the user has access to this repository
	if repo.OwnerID != userID && !repo.IsPublic {
		// Only allow access if the user is the owner or the repository is public
		http.Error(w, "Access denied", http.StatusForbidden)
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
	gitRepoName := repo.Name
	if !strings.HasSuffix(gitRepoName, ".git") {
		gitRepoName += ".git"
	}
	
	// Use username-based path to match SSH server path structure
	repoPath := filepath.Join(baseRepoPath, repo.Owner.Username, gitRepoName)

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

// GetCommitHistory handles requests to view commit history
func GetCommitHistory(w http.ResponseWriter, r *http.Request) {
	// Get the repository ID from the URL
	vars := mux.Vars(r)
	repoID := vars["id"]

	// Get the authenticated user ID, but don't require it for public repositories
	userID := getUserIDOptional(r)

	// Get the repository
	repo, err := models.GetRepositoryByID(repoID)
	if err != nil {
		http.Error(w, "Error retrieving repository", http.StatusInternalServerError)
		return
	}

	if repo == nil {
		http.Error(w, "Repository not found", http.StatusNotFound)
		return
	}

	// Check if the user has access to this repository
	if repo.OwnerID != userID && !repo.IsPublic {
		// Only allow access if the user is the owner or the repository is public
		http.Error(w, "Access denied", http.StatusForbidden)
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
	gitRepoName := repo.Name
	if !strings.HasSuffix(gitRepoName, ".git") {
		gitRepoName += ".git"
	}
	
	// Use username-based path to match SSH server path structure
	repoPath := filepath.Join(baseRepoPath, repo.Owner.Username, gitRepoName)

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
