package main

import (
	"fmt"
	"log"
	"os"

	"github-clone/config"
	
	_ "github.com/mattn/go-sqlite3"
)

func main() {
	// Load environment variables
	config.LoadEnv()

	// Connect to the database
	if err := config.ConnectDB(); err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer config.DB.Close()

	// No args = show repositories
	if len(os.Args) == 1 {
		showRepositories()
		return
	}

	// With args = update repository
	if len(os.Args) != 3 {
		fmt.Println("Usage: go run update_repo_public.go <repo_name> <is_public>")
		fmt.Println("Example: go run update_repo_public.go test true")
		return
	}

	repoName := os.Args[1]
	isPublicStr := os.Args[2]
	isPublic := isPublicStr == "true" || isPublicStr == "1"

	updateRepository(repoName, isPublic)
}

func showRepositories() {
	rows, err := config.DB.Query(`
		SELECT r.id, r.name, r.description, r.is_public, u.username 
		FROM repositories r
		JOIN users u ON r.owner_id = u.id
	`)
	if err != nil {
		log.Fatalf("Failed to query repositories: %v", err)
	}
	defer rows.Close()

	fmt.Println("ID\t\t\t\t\tName\tOwner\tPublic\tDescription")
	fmt.Println("----------------------------------------------------------------------")

	for rows.Next() {
		var id, name, description string
		var username string
		var isPublic bool

		if err := rows.Scan(&id, &name, &description, &isPublic, &username); err != nil {
			log.Printf("Error scanning row: %v", err)
			continue
		}

		fmt.Printf("%s\t%s\t%s\t%v\t%s\n", id, name, username, isPublic, description)
	}
}

func updateRepository(repoName string, isPublic bool) {
	result, err := config.DB.Exec(
		"UPDATE repositories SET is_public = ? WHERE name = ?",
		isPublic, repoName,
	)
	if err != nil {
		log.Fatalf("Failed to update repository: %v", err)
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		fmt.Printf("No repository found with name '%s'\n", repoName)
		return
	}

	fmt.Printf("Repository '%s' updated. IsPublic = %v\n", repoName, isPublic)
}
