package handlers

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gorilla/mux"
)

// HandleGitHTTP handles Git HTTP protocol requests
// This is a simplified implementation that proxies requests to git-http-backend
func HandleGitHTTP(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	username := vars["username"]
	reponame := vars["reponame"]

	if username == "" || reponame == "" {
		http.Error(w, "Invalid repository path", http.StatusBadRequest)
		return
	}

	// Keep the .git suffix since our repository is stored with it
	// Only trim the .git suffix if it's not present in the path for displaying purposes
	repoDirName := reponame
	if !strings.HasSuffix(repoDirName, ".git") {
		repoDirName = repoDirName + ".git"
	}

	// Get current working directory
	cwd, err := os.Getwd()
	if err != nil {
		log.Printf("Error getting current directory: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	
	// Try different potential repository paths with the .git extension
	potentialPaths := []string{
		filepath.Join(cwd, "repositories", username, repoDirName),   // Default path
		filepath.Join(cwd, "data", "repositories", username, repoDirName), // Alternative path
	}
	
	// Debug output
	log.Printf("Request for repository: %s/%s", username, repoDirName)
	log.Printf("Looking for repository in: %v", potentialPaths)
	
	// Check if repository exists in any of the potential paths
	var repoPath string
	for _, path := range potentialPaths {
		if _, err := os.Stat(path); !os.IsNotExist(err) {
			repoPath = path
			log.Printf("Found repository at: %s", repoPath)
			break
		}
	}
	
	if repoPath == "" {
		log.Printf("Repository not found at any of the expected paths")
		http.Error(w, "Repository not found", http.StatusNotFound)
		return
	}

	// Set Git HTTP backend headers
	w.Header().Set("Content-Type", "application/x-git-receive-pack-result")
	
	// Log the request for debugging
	log.Printf("Git HTTP request: %s %s", r.Method, r.URL.Path)
	
	// Extract the operation type from the URL path
	var operation string
	if strings.Contains(r.URL.Path, "info/refs") {
		operation = "info/refs"
	} else if strings.Contains(r.URL.Path, "git-upload-pack") {
		operation = "git-upload-pack"
	} else if strings.Contains(r.URL.Path, "git-receive-pack") {
		operation = "git-receive-pack"
	} else {
		operation = "repository-root"
	}
	
	// Display detailed information for diagnostic purposes
	fmt.Fprintf(w, "Git HTTP protocol endpoint reached\n")
	fmt.Fprintf(w, "\nRepository: %s/%s\n", username, repoDirName)
	fmt.Fprintf(w, "Operation: %s\n", operation)
	fmt.Fprintf(w, "Repository path: %s\n", repoPath)
	fmt.Fprintf(w, "\nThis endpoint is under development.\n")
	fmt.Fprintf(w, "For now, please use SSH for Git operations: ssh://git@localhost:2222/%s/%s\n", username, repoDirName)
	
	// For production use, this would proxy to git-http-backend CGI script
	// Example implementation would invoke the git-http-backend CGI with the appropriate environment variables
}
