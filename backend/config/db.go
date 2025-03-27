package config

import (
	"database/sql"
	"fmt"
	"os"

	_ "github.com/lib/pq"
)

// DB is the database connection
var DB *sql.DB

// ConnectDB initializes the database connection
func ConnectDB() error {
	// Get database connection parameters from environment variables
	host := os.Getenv("DB_HOST")
	port := os.Getenv("DB_PORT")
	user := os.Getenv("DB_USER")
	password := os.Getenv("DB_PASSWORD")
	dbname := os.Getenv("DB_NAME")

	// Construct the connection string
	connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		host, port, user, password, dbname)

	// Connect to the database
	var err error
	DB, err = sql.Open("postgres", connStr)
	if err != nil {
		return err
	}

	// Check the connection
	err = DB.Ping()
	if err != nil {
		return err
	}

	// Create the users table if it doesn't exist
	_, err = DB.Exec(`
		CREATE TABLE IF NOT EXISTS users (
			id VARCHAR(36) PRIMARY KEY,
			username VARCHAR(50) UNIQUE NOT NULL,
			email VARCHAR(255) UNIQUE NOT NULL,
			password VARCHAR(255) NOT NULL,
			created_at TIMESTAMP NOT NULL,
			updated_at TIMESTAMP NOT NULL
		)
	`)
	if err != nil {
		return err
	}
	
	// Create the repositories table if it doesn't exist
	_, err = DB.Exec(`
		CREATE TABLE IF NOT EXISTS repositories (
			id VARCHAR(36) PRIMARY KEY,
			name VARCHAR(100) NOT NULL,
			description TEXT,
			owner_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			is_public BOOLEAN NOT NULL DEFAULT true,
			created_at TIMESTAMP NOT NULL,
			updated_at TIMESTAMP NOT NULL,
			UNIQUE(owner_id, name)
		)
	`)
	if err != nil {
		return err
	}
	
	// Create the collaborators table for repository access management
	_, err = DB.Exec(`
		CREATE TABLE IF NOT EXISTS repository_collaborators (
			repository_id VARCHAR(36) NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
			user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			permission VARCHAR(20) NOT NULL, -- 'read', 'write', 'admin'
			created_at TIMESTAMP NOT NULL,
			PRIMARY KEY (repository_id, user_id)
		)
	`)

	return err
}
