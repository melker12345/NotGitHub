package main

import (
	"context" // Added for AuthMiddleware
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings" // Added for AuthMiddleware

	"github-clone/auth"   // Added for AuthMiddleware
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

	// Apply AuthMiddleware for all routes (it will skip public paths)
	router.Use(AuthMiddleware)

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

// AuthMiddleware validates the JWT token and sets the userID in the request context.
func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Define public paths that don't require authentication
		publicPaths := []string{
			"/api/auth/login",
			"/api/auth/register",
			"/api/health",
			"/api/repositories/public",            // List all public repos
			"/api/repositories/user",            // List a specific user's public repos
			"/api/users/",                       // Prefix for /api/users/{username}/stats
			"/api/public/",                    // Prefix for public repo content /api/public/{username}/{reponame}/*
			// Git public access: info/refs for clone, and GET on /git/{username}/{reponame} for smart server discovery
			// Actual git operations like upload-pack for public repos are handled by HandleGitHTTP's internal logic.
			// Pushes (receive-pack) are always authenticated by HandleGitHTTP.
		}

		requestPath := r.URL.Path
		isPublic := false
		for _, publicPath := range publicPaths {
			if strings.HasPrefix(requestPath, publicPath) {
				// Allow /api/users/{username}/stats
				if publicPath == "/api/users/" && strings.HasSuffix(requestPath, "/stats") {
					isPublic = true
					break
				} else if publicPath == "/api/public/" {
					isPublic = true
					break
				} else if publicPath != "/api/users/" && publicPath != "/api/public/" {
					isPublic = true
					break
				}
			}
		}

		// Handle Git routes: some can be public (for clone/fetch of public repos),
		// but we still want to pass userID if a token is provided for potential private access checks later.
		if strings.HasPrefix(requestPath, "/git/") {
			tokenString := extractToken(r)
			if tokenString != "" {
				claims, _ := auth.ValidateToken(tokenString) // Ignore error for optional auth
				if claims != nil {
					ctx := context.WithValue(r.Context(), auth.UserIDKey, claims.UserID)
					r = r.WithContext(ctx)
				}
			}
			// For specific git paths like info/refs or GET on the base git path, allow if repo is public (checked in HandleGitHTTP)
			// For git-upload-pack (fetch/clone data), also allow if repo is public (checked in HandleGitHTTP)
			// git-receive-pack (push) is always authenticated within HandleGitHTTP.
			if r.Method == "GET" && (strings.HasSuffix(requestPath, "/info/refs") || len(strings.Split(strings.TrimPrefix(requestPath, "/git/"), "/")) == 2) {
				// This covers GET /git/{user}/{repo} and GET /git/{user}/{repo}/info/refs
				// Actual public/private check happens in HandleGitHTTP
				next.ServeHTTP(w, r)
				return
			}
			if r.Method == "POST" && strings.HasSuffix(requestPath, "/git-upload-pack") {
				// Actual public/private check happens in HandleGitHTTP
				next.ServeHTTP(w, r)
				return
			}
			// All other Git paths (like git-receive-pack) or if not explicitly public, fall through to require token
		}

		if isPublic && !strings.HasPrefix(requestPath, "/git/") {
			next.ServeHTTP(w, r)
			return
		}

		// For protected paths (or Git paths not handled above as public-passthrough)
		log.Printf("AuthMiddleware: Entering protected path logic for %s", r.URL.Path)
		tokenString := extractToken(r)
		if tokenString == "" {
			log.Println("AuthMiddleware: No Authorization header for protected route")
			http.Error(w, "Authorization header required", http.StatusUnauthorized)
			return
		}
		log.Printf("AuthMiddleware: Extracted token for %s. Token prefix: %s... Attempting validation.", r.URL.Path, tokenString[:min(len(tokenString),10)])

		claims, err := auth.ValidateToken(tokenString)
		if err != nil {
			log.Printf("AuthMiddleware: Token validation FAILED for path %s. Token prefix: %s... Error: %v", r.URL.Path, tokenString[:min(len(tokenString),10)], err)
			http.Error(w, "Invalid or expired token", http.StatusUnauthorized)
			return
		}
		log.Printf("AuthMiddleware: Token validation SUCCESS for UserID: %s, Path: %s", claims.UserID, r.URL.Path)

		ctx := context.WithValue(r.Context(), auth.UserIDKey, claims.UserID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// min is a helper function to avoid panics if string is too short
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func extractToken(r *http.Request) string {
	bearToken := r.Header.Get("Authorization")
	strArr := strings.Split(bearToken, " ")
	if len(strArr) == 2 {
		return strArr[1]
	}
	return ""
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
