package main

import (
	"fmt"
	"github-clone/config"
	"log"
	"os"
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

	// Delete the repository
	repoID := "a14ae559-c329-4f80-82a9-8f9fb08db277"
	
	// First delete any issues associated with the repository
	_, err := config.DB.Exec("DELETE FROM issues WHERE repository_id = ?", repoID)
	if err != nil {
		fmt.Printf("Error deleting issues: %v\n", err)
		os.Exit(1)
	}
	
	// Delete the repository
	result, err := config.DB.Exec("DELETE FROM repositories WHERE id = ?", repoID)
	if err != nil {
		fmt.Printf("Error deleting repository: %v\n", err)
		os.Exit(1)
	}
	
	rowsAffected, _ := result.RowsAffected()
	fmt.Printf("Successfully deleted repository. Rows affected: %d\n", rowsAffected)
}
