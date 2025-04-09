package utils

import (
	"database/sql"
	"log"

	"github-clone/config"
)

// GetUsernameByID returns the username for a given user ID
func GetUsernameByID(userID string) (string, error) {
	// Query the database for the username
	var username string
	err := config.DB.QueryRow("SELECT username FROM users WHERE id = ?", userID).Scan(&username)
	
	if err != nil {
		if err == sql.ErrNoRows {
			return "", nil // No user found
		}
		log.Printf("Error retrieving username for ID %s: %v", userID, err)
		return "", err
	}
	
	return username, nil
}
