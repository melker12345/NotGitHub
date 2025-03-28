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
	
	// API routes
	router.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "Server is running")
	})
	
	// Auth routes
	router.HandleFunc("/api/auth/register", handlers.Register).Methods("POST")
	router.HandleFunc("/api/auth/login", handlers.Login).Methods("POST")
	
	// Repository routes
	router.HandleFunc("/api/repositories", handlers.CreateRepository).Methods("POST")
	router.HandleFunc("/api/repositories", handlers.GetUserRepositories).Methods("GET")
	router.HandleFunc("/api/repositories/{id}", handlers.GetRepository).Methods("GET")
	router.HandleFunc("/api/repositories/{id}", handlers.UpdateRepository).Methods("PUT")
	router.HandleFunc("/api/repositories/{id}", handlers.DeleteRepository).Methods("DELETE")
	
	// SSH Key routes
	router.HandleFunc("/api/ssh-keys", handlers.AddSSHKey).Methods("POST")
	router.HandleFunc("/api/ssh-keys", handlers.GetSSHKeys).Methods("GET")
	router.HandleFunc("/api/ssh-keys/{id}", handlers.DeleteSSHKey).Methods("DELETE")
	
	// Enable CORS
	router.Use(corsMiddleware)
	
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
		// Set CORS headers
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		
		// Handle preflight requests
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		
		// Call the next handler
		next.ServeHTTP(w, r)
	})
}
