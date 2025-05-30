package config

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"

	_ "github.com/mattn/go-sqlite3"
)

var DB *sql.DB

// Initialize the database connection
func ConnectDB() error {
	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		// Use a default if is not set
		dir, err := os.Getwd()
		if err != nil {
			return fmt.Errorf("failed to get current directory: %w", err)
		}
		dbPath = filepath.Join(dir, "github-clone.db")
	}

	dbDir := filepath.Dir(dbPath)
	// Create the directory if it doesn't exist 
	if err := os.MkdirAll(dbDir, 0755); err != nil {
		return fmt.Errorf("failed to create database directory: %w", err)
	}

	log.Printf("Connecting to SQLite database at: %s", dbPath)

	// Open the SQLite database
	var err error
	DB, err = sql.Open("sqlite3", dbPath)
	if err != nil {
		return fmt.Errorf("error opening database connection: %w", err)
	}

	// Check the connection
	if err := DB.Ping(); err != nil {
		return fmt.Errorf("error pinging database: %w", err)
	}

	log.Println("Successfully connected to SQLite database")

	// Enable foreign keys in SQLite
	_, err = DB.Exec("PRAGMA foreign_keys = ON")
	if err != nil {
		return fmt.Errorf("error enabling foreign keys: %w", err)
	}

	// Create the users table if it doesn't exist
	_, err = DB.Exec(`
		CREATE TABLE IF NOT EXISTS users (
			id TEXT PRIMARY KEY,
			username TEXT UNIQUE NOT NULL,
			email TEXT UNIQUE NOT NULL,
			password TEXT NOT NULL,
			created_at TIMESTAMP NOT NULL,
			updated_at TIMESTAMP NOT NULL
		)
	`)
	if err != nil {
		return fmt.Errorf("error creating users table: %w", err)
	}
	
	// Create the repositories table if it doesn't exist
	_, err = DB.Exec(`
		CREATE TABLE IF NOT EXISTS repositories (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			description TEXT,
			owner_id TEXT NOT NULL,
			is_public BOOLEAN NOT NULL DEFAULT 1,
			created_at TIMESTAMP NOT NULL,
			updated_at TIMESTAMP NOT NULL,
			UNIQUE(owner_id, name),
			FOREIGN KEY(owner_id) REFERENCES users(id) ON DELETE CASCADE
		)
	`)
	if err != nil {
		return fmt.Errorf("error creating repositories table: %w", err)
	}
	
	// Create the collaborators table for repository access management
	_, err = DB.Exec(`
		CREATE TABLE IF NOT EXISTS repository_collaborators (
			repository_id TEXT NOT NULL,
			user_id TEXT NOT NULL,
			permission TEXT NOT NULL, -- 'read', 'write', 'admin'
			created_at TIMESTAMP NOT NULL,
			PRIMARY KEY (repository_id, user_id),
			FOREIGN KEY(repository_id) REFERENCES repositories(id) ON DELETE CASCADE,
			FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
		)
	`)
	if err != nil {
		return fmt.Errorf("error creating repository_collaborators table: %w", err)
	}
	
	// Create the SSH keys table for user authentication
	_, err = DB.Exec(`
		CREATE TABLE IF NOT EXISTS ssh_keys (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL,
			name TEXT NOT NULL,
			public_key TEXT NOT NULL,
			fingerprint TEXT UNIQUE NOT NULL,
			created_at TIMESTAMP NOT NULL,
			FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
		)
	`)
	if err != nil {
		return fmt.Errorf("error creating ssh_keys table: %w", err)
	}

	// Issues table 
	_, err = DB.Exec(`
		CREATE TABLE IF NOT EXISTS issues (
			id TEXT PRIMARY KEY,
			repository_id TEXT NOT NULL,
			title TEXT NOT NULL,
			description TEXT,
			created_by TEXT NOT NULL,
			created_at TIMESTAMP NOT NULL,
			updated_at TIMESTAMP NOT NULL,
			closed_at TIMESTAMP,
			closed_by TEXT,
			is_open BOOLEAN NOT NULL DEFAULT 1,
			FOREIGN KEY(repository_id) REFERENCES repositories(id) ON DELETE CASCADE
		)
	`)
	if err != nil {
		return fmt.Errorf("error creating issues table: %w", err)
	}
	
	// Create issue votes table 
	_, err = DB.Exec(`
		CREATE TABLE IF NOT EXISTS issue_votes (
			issue_id TEXT NOT NULL,
			user_id TEXT NOT NULL,
			vote INTEGER NOT NULL, -- 1 for upvote, -1 for downvote
			created_at TIMESTAMP NOT NULL,
			updated_at TIMESTAMP NOT NULL,
			PRIMARY KEY (issue_id, user_id),
			FOREIGN KEY(issue_id) REFERENCES issues(id) ON DELETE CASCADE,
			FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
		)
	`)
	if err != nil {
		return fmt.Errorf("error creating issue_votes table: %w", err)
	}
	
	return nil
}
