package main

import (
	"log"
	"os"
	"path/filepath"

	"github-clone/config"
)

// This script migrates repositories from the old UUID-based paths to the new username-based paths
// This ensures compatibility with the SSH server which expects repositories to be accessed via username/repository.git

func main() {
	// Initialize database connection
	if err := config.ConnectDB(); err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer config.DB.Close()

	// Get the base repositories directory
	baseRepoPath := os.Getenv("REPOSITORIES_PATH")
	if baseRepoPath == "" {
		// Default to a subdirectory in the current working directory
		dir, _ := os.Getwd()
		baseRepoPath = filepath.Join(dir, "repositories")
	}

	// Query all users directly
	rows, err := config.DB.Query("SELECT id, username FROM users")
	if err != nil {
		log.Fatalf("Failed to query users: %v", err)
	}
	defer rows.Close()

	// Store users in a slice
	type UserInfo struct {
		ID       string
		Username string
	}
	users := []UserInfo{}

	// Iterate through rows and build user list
	for rows.Next() {
		var user UserInfo
		if err := rows.Scan(&user.ID, &user.Username); err != nil {
			log.Printf("Error scanning user row: %v", err)
			continue
		}
		users = append(users, user)
	}

	log.Printf("Found %d users to process", len(users))

	if len(users) == 0 {
		log.Println("No users found. Nothing to migrate.")
		return
	}

	// Process each user's repositories
	for _, user := range users {
		// Query all repositories for the user
		repoRows, err := config.DB.Query("SELECT id, name FROM repositories WHERE owner_id = ?", user.ID)
		if err != nil {
			log.Printf("Error getting repositories for user %s: %v", user.Username, err)
			continue
		}

		defer repoRows.Close()

		// Store repositories in a slice
		type RepoInfo struct {
			ID   string
			Name string
		}
		repos := []RepoInfo{}

		// Iterate through rows and build repo list
		for repoRows.Next() {
			var repo RepoInfo
			if err := repoRows.Scan(&repo.ID, &repo.Name); err != nil {
				log.Printf("Error scanning repository row: %v", err)
				continue
			}
			repos = append(repos, repo)
		}

		log.Printf("Processing %d repositories for user %s", len(repos), user.Username)

		// Create the user's repository directory with username
		userRepoPath := filepath.Join(baseRepoPath, user.Username)
		if err := os.MkdirAll(userRepoPath, 0755); err != nil {
			log.Printf("Error creating directory for user %s: %v", user.Username, err)
			continue
		}

		// Process each repository
		for _, repo := range repos {
			// Old path using UUID
			oldPath := filepath.Join(baseRepoPath, user.ID, repo.Name+".git")
			
			// New path using username
			newPath := filepath.Join(baseRepoPath, user.Username, repo.Name+".git")

			// Check if the old repository exists
			if _, err := os.Stat(oldPath); os.IsNotExist(err) {
				log.Printf("Repository not found at old path: %s", oldPath)
				continue
			}

			// Check if the new path already exists
			if _, err := os.Stat(newPath); err == nil {
				log.Printf("Repository already exists at new path: %s", newPath)
				continue
			}

			// Move the repository
			log.Printf("Moving repository from %s to %s", oldPath, newPath)
			if err := os.Rename(oldPath, newPath); err != nil {
				log.Printf("Error moving repository: %v", err)
				continue
			}

			log.Printf("Successfully migrated repository: %s", repo.Name)
		}

		// Check if the old user directory is empty, and if so, remove it
		oldUserPath := filepath.Join(baseRepoPath, user.ID)
		entries, err := os.ReadDir(oldUserPath)
		if err == nil && len(entries) == 0 {
			if err := os.Remove(oldUserPath); err != nil {
				log.Printf("Failed to remove empty user directory %s: %v", oldUserPath, err)
			} else {
				log.Printf("Removed empty user directory: %s", oldUserPath)
			}
		}
	}

	log.Println("Repository migration completed successfully!")
}
