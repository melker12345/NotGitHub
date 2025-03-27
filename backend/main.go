package main

import (
	"fmt"
	"log"
	"net/http"
	
	"github-clone/config"
	"github-clone/handlers"
	
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
	port := "8080"
	
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
	
	// Enable CORS
	router.Use(corsMiddleware)
	
	// Start the server
	log.Printf("Server starting on port %s", port)
	if err := http.ListenAndServe(":"+port, router); err != nil {
		log.Fatalf("Failed to start server: %v", err)
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
