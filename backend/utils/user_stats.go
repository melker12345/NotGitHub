package utils

import (
	"database/sql"
	"fmt"
	"github-clone/config"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

// Repository represents a simplified repository model for statistics
type Repository struct {
	ID          string // Changed from int to string to handle UUID format
	Name        string
	Description string
	IsPublic    bool
	OwnerID     string // Changed from int to string to handle UUID format
	OwnerName   string
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

// GetUserRepositoriesFromDB fetches all repositories for a specific user from the database
func GetUserRepositoriesFromDB(username string) ([]Repository, error) {
	var repositories []Repository

	query := `
		SELECT 
			r.id, r.name, r.description, r.is_public, r.created_at, r.updated_at, 
			u.id, u.username 
		FROM 
			repositories r 
		JOIN 
			users u ON r.owner_id = u.id 
		WHERE 
			u.username = $1
	`

	rows, err := config.DB.Query(query, username)
	if err != nil {
		return repositories, err
	}
	defer rows.Close()

	for rows.Next() {
		var repo Repository
		var ownerName string
		var createdAt time.Time
		var updatedAt sql.NullTime

		err := rows.Scan(
			&repo.ID, &repo.Name, &repo.Description, &repo.IsPublic, &createdAt, &updatedAt,
			&repo.OwnerID, &ownerName,
		)
		if err != nil {
			return repositories, err
		}

		repo.OwnerName = ownerName
		repo.CreatedAt = createdAt
		if updatedAt.Valid {
			repo.UpdatedAt = updatedAt.Time
		}

		repositories = append(repositories, repo)
	}

	if err = rows.Err(); err != nil {
		return repositories, err
	}

	return repositories, nil
}

// GetRepositoryCommitCount returns the number of commits in a repository
func GetRepositoryCommitCount(username, repoName string) (int, error) {
	// Get base repository storage path - using "repositories" folder with .git suffix
	dir, _ := os.Getwd()
	repoBasePath := filepath.Join(dir, "repositories")
	
	// Append .git to the repository name as seen in the file structure
	repoPath := filepath.Join(repoBasePath, username, repoName+".git")

	// Use git rev-list command to count all commits
	cmd := exec.Command("git", "-C", repoPath, "rev-list", "--count", "HEAD")
	output, err := cmd.Output()
	if err != nil {
		return 0, fmt.Errorf("error counting commits: %v", err)
	}

	// Parse the output to get the commit count
	commitCount, err := strconv.Atoi(strings.TrimSpace(string(output)))
	if err != nil {
		return 0, fmt.Errorf("error parsing commit count: %v", err)
	}

	return commitCount, nil
}
