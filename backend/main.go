package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"

	"github-clone/config"
	"github-clone/handlers"
	"github-clone/ssh"

	"github.com/gorilla/mux"
)

func main() {
	config.LoadEnv()

	if err := config.ConnectDB(); err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	defer config.DB.Close()

	// Set up server port
	httpPort := os.Getenv("HTTP_PORT")
	if httpPort == "" {
		httpPort = "8080"
	}

	sshPort := os.Getenv("SSH_PORT")
	if sshPort == "" {
		sshPort = "2222" // Use 2222 to avoid conflicts
	}

	// Set up host key path
	hostKeyPath := os.Getenv("SSH_HOST_KEY_PATH")
	if hostKeyPath == "" {
		dir, _ := os.Getwd()
		hostKeyPath = filepath.Join(dir, "ssh_host_key")
	}

	go startSSHServer(sshPort, hostKeyPath)

	router := mux.NewRouter()

	// Apply CORS for all routes
	router.Use(corsMiddleware)

	// API routes
	router.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "Server is running")
	}).Methods("GET", "OPTIONS")

	// Public repository
	router.HandleFunc("/api/repositories/public", handlers.GetPublicRepositories).Methods("GET", "OPTIONS")
	router.HandleFunc("/api/repositories/user", handlers.GetUserPublicRepositories).Methods("GET", "OPTIONS")
	
	// User statistics endpoint
	router.HandleFunc("/api/users/{username}/stats", handlers.GetUserStats).Methods("GET", "OPTIONS")

	// Auth routes
	router.HandleFunc("/api/auth/register", handlers.Register).Methods("POST", "OPTIONS")
	router.HandleFunc("/api/auth/login", handlers.Login).Methods("POST", "OPTIONS")
	router.HandleFunc("/api/user/git-access-token", handlers.GenerateGitAccessTokenHandler).Methods("POST", "OPTIONS") // New route for Git access token generation

	// GitHub-like Repository routes
	router.HandleFunc("/api/{username}/{reponame}", handlers.GetRepositoryByUsername).Methods("GET", "OPTIONS")
	router.HandleFunc("/api/{username}/{reponame}", handlers.UpdateRepositoryByUsername).Methods("PUT", "OPTIONS")
	router.HandleFunc("/api/{username}/{reponame}", handlers.DeleteRepositoryByUsername).Methods("DELETE", "OPTIONS")
	router.HandleFunc("/api/{username}/{reponame}/contents", handlers.GetRepositoryContentsByUsername).Methods("GET", "OPTIONS")
	router.HandleFunc("/api/{username}/{reponame}/file", handlers.GetFileContentByUsername).Methods("GET", "OPTIONS")
	router.HandleFunc("/api/{username}/{reponame}/commits", handlers.GetCommitHistoryByUsername).Methods("GET", "OPTIONS")
	// Debug endpoint
	router.HandleFunc("/api/{username}/{reponame}/debug", handlers.DebugRepositoryPath).Methods("GET", "OPTIONS")
	
	// Public repository 
	router.HandleFunc("/api/public/{username}/{reponame}/contents", handlers.GetPublicRepositoryContents).Methods("GET", "OPTIONS")
	router.HandleFunc("/api/public/{username}/{reponame}/file", handlers.GetPublicFileContent).Methods("GET", "OPTIONS")
	
	// Issue routes
	router.HandleFunc("/api/repos/{owner}/{repo}/issues", handlers.CreateIssue).Methods("POST", "OPTIONS")
	router.HandleFunc("/api/repos/{owner}/{repo}/issues", handlers.GetRepositoryIssues).Methods("GET", "OPTIONS")
	router.HandleFunc("/api/repos/{owner}/{repo}/issues/{id}", handlers.GetIssue).Methods("GET", "OPTIONS")
	router.HandleFunc("/api/repos/{owner}/{repo}/issues/{id}", handlers.UpdateIssueStatus).Methods("PATCH", "OPTIONS")
	
	// Issue voting routes
	router.HandleFunc("/api/repos/{owner}/{repo}/issues/{id}/vote", handlers.VoteOnIssue).Methods("POST", "OPTIONS")
	router.HandleFunc("/api/repos/{owner}/{repo}/issues/{id}/vote", handlers.RemoveVoteFromIssue).Methods("DELETE", "OPTIONS")
	
	// Git HTTP protocol routes
	router.HandleFunc("/git/{username}/{reponame}", handlers.HandleGitHTTP).Methods("GET", "POST", "OPTIONS")
	router.HandleFunc("/git/{username}/{reponame}/info/refs", handlers.HandleGitHTTP).Methods("GET", "OPTIONS")
	router.HandleFunc("/git/{username}/{reponame}/git-upload-pack", handlers.HandleGitHTTP).Methods("POST", "OPTIONS")
	router.HandleFunc("/git/{username}/{reponame}/git-receive-pack", handlers.HandleGitHTTP).Methods("POST", "OPTIONS")

	// Repository listing 
	router.HandleFunc("/api/repositories", handlers.GetUserRepositories).Methods("GET", "OPTIONS")
	router.HandleFunc("/api/repositories", handlers.CreateRepository).Methods("POST", "OPTIONS")

	// SSH Key routes
	router.HandleFunc("/api/ssh-keys", handlers.AddSSHKey).Methods("POST", "OPTIONS")
	router.HandleFunc("/api/ssh-keys", handlers.GetSSHKeys).Methods("GET", "OPTIONS")
	router.HandleFunc("/api/ssh-keys/{id}", handlers.DeleteSSHKey).Methods("DELETE", "OPTIONS")

	log.Printf("HTTP server starting on port %s", httpPort)
	if err := http.ListenAndServe(":"+httpPort, router); err != nil {
		log.Fatalf("Failed to start HTTP server: %v", err)
	}
}

// startSSHServer initializes and starts the SSH server
func startSSHServer(port, hostKeyPath string) {
	listenAddr := fmt.Sprintf("0.0.0.0:%s", port)

	server, err := ssh.NewServer(listenAddr, hostKeyPath)
	if err != nil {
		log.Fatalf("Failed to create SSH server: %v", err)
	}

	log.Printf("Starting SSH server on port %s", port)
	if err := server.Start(); err != nil {
		log.Fatalf("Failed to start SSH server: %v", err)
	}
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Set CORS headers for all requests
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Max-Age", "3600")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}
