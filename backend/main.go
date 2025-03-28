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
	// Load environment variables
	config.LoadEnv()
	
	// Connect to the database
	if err := config.ConnectDB(); err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	
	// Close database connection when application exits
	defer config.DB.Close()
	
	// Set up server port
	httpPort := os.Getenv("HTTP_PORT")
	if httpPort == "" {
		httpPort = "8080"
	}
	
	// Set up SSH server port
	sshPort := os.Getenv("SSH_PORT")
	if sshPort == "" {
		sshPort = "2222" // Default SSH port is 22, but we use 2222 to avoid conflicts
	}
	
	// Set up host key path
	hostKeyPath := os.Getenv("SSH_HOST_KEY_PATH")
	if hostKeyPath == "" {
		// Default to a file in the current directory
		dir, _ := os.Getwd()
		hostKeyPath = filepath.Join(dir, "ssh_host_key")
	}
	
	// Start SSH server in a goroutine
	go startSSHServer(sshPort, hostKeyPath)
	
	// Create a new router
	router := mux.NewRouter()
	
	// Apply CORS middleware to all routes
	router.Use(corsMiddleware)
	
	// API routes
	router.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "Server is running")
	}).Methods("GET", "OPTIONS")
	
	// Auth routes - explicitly allow OPTIONS
	router.HandleFunc("/api/auth/register", handlers.Register).Methods("POST", "OPTIONS")
	router.HandleFunc("/api/auth/login", handlers.Login).Methods("POST", "OPTIONS")
	
	// GitHub-like Repository routes (username/reponame style)
	router.HandleFunc("/api/{username}/{reponame}", handlers.GetRepositoryByUsername).Methods("GET", "OPTIONS")
	router.HandleFunc("/api/{username}/{reponame}", handlers.UpdateRepositoryByUsername).Methods("PUT", "OPTIONS")
	router.HandleFunc("/api/{username}/{reponame}", handlers.DeleteRepositoryByUsername).Methods("DELETE", "OPTIONS")
	router.HandleFunc("/api/{username}/{reponame}/contents", handlers.GetRepositoryContentsByUsername).Methods("GET", "OPTIONS")
	router.HandleFunc("/api/{username}/{reponame}/file", handlers.GetFileContentByUsername).Methods("GET", "OPTIONS")
	router.HandleFunc("/api/{username}/{reponame}/commits", handlers.GetCommitHistoryByUsername).Methods("GET", "OPTIONS")
	
	// Repository listing and creation endpoints
	router.HandleFunc("/api/repositories", handlers.GetUserRepositories).Methods("GET", "OPTIONS")
	router.HandleFunc("/api/repositories", handlers.CreateRepository).Methods("POST", "OPTIONS")
	
	// SSH Key routes - explicitly allow OPTIONS
	router.HandleFunc("/api/ssh-keys", handlers.AddSSHKey).Methods("POST", "OPTIONS")
	router.HandleFunc("/api/ssh-keys", handlers.GetSSHKeys).Methods("GET", "OPTIONS")
	router.HandleFunc("/api/ssh-keys/{id}", handlers.DeleteSSHKey).Methods("DELETE", "OPTIONS")
	
	// Start the HTTP server
	log.Printf("HTTP server starting on port %s", httpPort)
	if err := http.ListenAndServe(":"+httpPort, router); err != nil {
		log.Fatalf("Failed to start HTTP server: %v", err)
	}
}

// startSSHServer initializes and starts the SSH server
func startSSHServer(port, hostKeyPath string) {
	listenAddr := fmt.Sprintf("0.0.0.0:%s", port)
	
	// Create a new SSH server
	server, err := ssh.NewServer(listenAddr, hostKeyPath)
	if err != nil {
		log.Fatalf("Failed to create SSH server: %v", err)
	}
	
	// Start the server (this will block)
	log.Printf("Starting SSH server on port %s", port)
	if err := server.Start(); err != nil {
		log.Fatalf("Failed to start SSH server: %v", err)
	}
}

// CORS middleware to allow requests from the frontend
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Set CORS headers for all requests
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Max-Age", "3600") // Cache preflight response for 1 hour
		
		// Handle preflight OPTIONS requests immediately
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		
		// Call the next handler for non-OPTIONS requests
		next.ServeHTTP(w, r)
	})
}
