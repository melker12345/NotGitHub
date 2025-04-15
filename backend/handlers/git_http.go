package handlers

import (
	"bufio"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github-clone/models"
	"github-clone/utils"

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
	
	// Get authentication information if present, optional for public repos
	userID := getUserIDOptional(r)
	
	// Check repository visibility to determine if the user has access
	repo, err := models.GetRepositoryByUsernameAndName(username, reponame)
	if err != nil {
		log.Printf("Error retrieving repository information: %v", err)
		// Continue processing, we'll check for repo existence on the filesystem
	} else if repo != nil {
		// If the repository exists in the database, check if the user has access
		repoAccessChecker := utils.NewRepoAccess()
		if !repoAccessChecker.CanCloneRepository(repo.OwnerID, repo.IsPublic, userID) {
			http.Error(w, "You don't have access to this repository", http.StatusForbidden)
			return
		}
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

	// Log the request for debugging
	log.Printf("Git HTTP request: %s %s", r.Method, r.URL.Path)
	
	// Extract the operation type from the URL path
	var operation string
	var service string
	if strings.Contains(r.URL.Path, "info/refs") {
		operation = "info/refs"
		// Get the service parameter
		service = r.URL.Query().Get("service")
	} else if strings.Contains(r.URL.Path, "git-upload-pack") {
		operation = "git-upload-pack"
		service = "git-upload-pack"
	} else if strings.Contains(r.URL.Path, "git-receive-pack") {
		operation = "git-receive-pack"
		service = "git-receive-pack"
	} else {
		operation = "repository-root"
	}
	
	log.Printf("Git operation: %s, service: %s", operation, service)
	
	// Execute git-http-backend as a subprocess
	// This is the simplest way to implement the Git HTTP protocol
	// Create the command
	cmd := exec.Command("git", "http-backend")
	
	// Get the base repository path (without username/repo.git)
	repoBase := filepath.Dir(filepath.Dir(repoPath))
	log.Printf("Repository base path: %s", repoBase)
	
	// Calculate the correct path info relative to the repository base
	// The PathInfo should be the part after /git/ in the URL: /username/repo.git/info/refs
	pathInfo := strings.Replace(r.URL.Path, "/git", "", 1)
	log.Printf("PATH_INFO: %s", pathInfo)
	
	// Set up the environment for git-http-backend
	cmd.Env = append(os.Environ(),
		"GIT_PROJECT_ROOT="+repoBase,
		"GIT_HTTP_EXPORT_ALL=true",
		"PATH_INFO="+pathInfo,
		"QUERY_STRING="+r.URL.RawQuery,
		"REQUEST_METHOD="+r.Method,
		"CONTENT_TYPE="+r.Header.Get("Content-Type"),
	)
	
	if r.Header.Get("Content-Length") != "" {
		cmd.Env = append(cmd.Env, "CONTENT_LENGTH="+r.Header.Get("Content-Length"))
	}
	
	// Create pipes for stdin, stdout, stderr
	stdin, err := cmd.StdinPipe()
	if err != nil {
		log.Printf("Error creating stdin pipe: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		log.Printf("Error creating stdout pipe: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	
	stderr, err := cmd.StderrPipe()
	if err != nil {
		log.Printf("Error creating stderr pipe: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	
	// Start the command
	if err := cmd.Start(); err != nil {
		log.Printf("Error starting git-http-backend: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	
	// Copy request body to stdin
	if r.Body != nil {
		defer r.Body.Close()
		_, err := io.Copy(stdin, r.Body)
		if err != nil {
			log.Printf("Error copying request body to stdin: %v", err)
		}
	}
	stdin.Close()
	
	// Read and parse headers from stdout
	bufReader := bufio.NewReader(stdout)
	headerEnded := false
	headers := make(map[string]string)
	
	for !headerEnded {
		line, err := bufReader.ReadString('\n')
		if err != nil || line == "\r\n" || line == "\n" {
			headerEnded = true
			if err != nil && err != io.EOF {
				log.Printf("Error reading headers: %v", err)
				http.Error(w, "Internal server error", http.StatusInternalServerError)
				return
			}
			continue
		}
		
		parts := strings.SplitN(strings.TrimSpace(line), ":", 2)
		if len(parts) == 2 {
			headers[parts[0]] = strings.TrimSpace(parts[1])
		}
	}
	
	// Set response headers
	for key, value := range headers {
		w.Header().Set(key, value)
	}
	
	// If no Content-Type was set, use a default
	if w.Header().Get("Content-Type") == "" {
		if strings.HasSuffix(r.URL.Path, "/info/refs") {
			if service == "git-upload-pack" {
				w.Header().Set("Content-Type", "application/x-git-upload-pack-advertisement")
			} else if service == "git-receive-pack" {
				w.Header().Set("Content-Type", "application/x-git-receive-pack-advertisement")
			}
		} else if strings.Contains(r.URL.Path, "git-upload-pack") {
			w.Header().Set("Content-Type", "application/x-git-upload-pack-result")
		} else if strings.Contains(r.URL.Path, "git-receive-pack") {
			w.Header().Set("Content-Type", "application/x-git-receive-pack-result")
		}
	}
	
	// Copy remaining stdout to response
	_, err = io.Copy(w, bufReader)
	if err != nil {
		log.Printf("Error copying stdout to response: %v", err)
	}
	
	// Read stderr for debugging
	defer cmd.Wait()

	errOutput, _ := io.ReadAll(stderr)
	if len(errOutput) > 0 {
		log.Printf("git-http-backend stderr: %s", string(errOutput))
	}
}
