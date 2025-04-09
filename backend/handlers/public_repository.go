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

// GetPublicRepositoryContents handles public access to repository content
// This handler specifically doesn't require any authentication
func GetPublicRepositoryContents(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	username := vars["username"]
	repoName := vars["reponame"]
	
	fmt.Printf("Accessing public repo contents: %s/%s\n", username, repoName)

	// Get the repository without requiring auth
	repo, err := models.GetRepositoryByUsernameAndName(username, repoName)
	if err != nil {
		http.Error(w, "Error retrieving repository", http.StatusInternalServerError)
		return
	}

	if repo == nil {
		http.Error(w, "Repository not found", http.StatusNotFound)
		return
	}

	// Only allow access to public repositories
	if !repo.IsPublic {
		http.Error(w, "This repository is not public", http.StatusForbidden)
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

// GetPublicFileContent handles public access to file content
// This handler specifically doesn't require any authentication
func GetPublicFileContent(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	username := vars["username"]
	repoName := vars["reponame"]
	
	fmt.Printf("Accessing public file content: %s/%s\n", username, repoName)

	// Get the repository without requiring auth
	repo, err := models.GetRepositoryByUsernameAndName(username, repoName)
	if err != nil {
		http.Error(w, "Error retrieving repository", http.StatusInternalServerError)
		return
	}

	if repo == nil {
		http.Error(w, "Repository not found", http.StatusNotFound)
		return
	}

	// Only allow access to public repositories
	if !repo.IsPublic {
		http.Error(w, "This repository is not public", http.StatusForbidden)
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
