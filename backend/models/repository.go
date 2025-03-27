package models

import (
	"database/sql"
	"errors"
	"os"
	"path/filepath"
	"time"

	"github-clone/config"
	
	"github.com/google/uuid"
)

// Repository represents a code repository in the system
type Repository struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	OwnerID     string    `json:"owner_id"`
	IsPublic    bool      `json:"is_public"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// RepositoryInput is used for creating or updating repositories
type RepositoryInput struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	IsPublic    bool   `json:"is_public"`
}

// CreateRepository creates a new repository in the database and filesystem
func CreateRepository(ownerID string, input RepositoryInput) (*Repository, error) {
	// Generate a unique ID 
	id := uuid.New().String()
	now := time.Now()
	
	// Create the repository struct
	repo := &Repository{
		ID:          id,
		Name:        input.Name,
		Description: input.Description,
		OwnerID:     ownerID,
		IsPublic:    input.IsPublic,
		CreatedAt:   now,
		UpdatedAt:   now,
	}
	
	// Insert the repository into the database
	_, err := config.DB.Exec(
		"INSERT INTO repositories (id, name, description, owner_id, is_public, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
		repo.ID, repo.Name, repo.Description, repo.OwnerID, repo.IsPublic, repo.CreatedAt, repo.UpdatedAt,
	)
	
	if err != nil {
		return nil, err
	}
	
	// Create repository directory structure
	err = createRepositoryFileSystem(repo.OwnerID, repo.Name)
	if err != nil {
		// If filesystem creation fails, attempt to rollback the database insertion
		config.DB.Exec("DELETE FROM repositories WHERE id = $1", repo.ID)
		return nil, err
	}
	
	return repo, nil
}

// GetRepositoryByID fetches a repository by its ID
func GetRepositoryByID(id string) (*Repository, error) {
	var repo Repository
	
	err := config.DB.QueryRow(
		"SELECT id, name, description, owner_id, is_public, created_at, updated_at FROM repositories WHERE id = $1",
		id,
	).Scan(&repo.ID, &repo.Name, &repo.Description, &repo.OwnerID, &repo.IsPublic, &repo.CreatedAt, &repo.UpdatedAt)
	
	if err == sql.ErrNoRows {
		return nil, nil
	}
	
	if err != nil {
		return nil, err
	}
	
	return &repo, nil
}

// GetRepositoryByOwnerAndName fetches a repository by owner ID and repository name
func GetRepositoryByOwnerAndName(ownerID, name string) (*Repository, error) {
	var repo Repository
	
	err := config.DB.QueryRow(
		"SELECT id, name, description, owner_id, is_public, created_at, updated_at FROM repositories WHERE owner_id = $1 AND name = $2",
		ownerID, name,
	).Scan(&repo.ID, &repo.Name, &repo.Description, &repo.OwnerID, &repo.IsPublic, &repo.CreatedAt, &repo.UpdatedAt)
	
	if err == sql.ErrNoRows {
		return nil, nil
	}
	
	if err != nil {
		return nil, err
	}
	
	return &repo, nil
}

// GetUserRepositories fetches all repositories owned by a user
func GetUserRepositories(userID string) ([]*Repository, error) {
	rows, err := config.DB.Query(
		"SELECT id, name, description, owner_id, is_public, created_at, updated_at FROM repositories WHERE owner_id = $1 ORDER BY created_at DESC",
		userID,
	)
	
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	
	repositories := []*Repository{}
	
	for rows.Next() {
		var repo Repository
		err := rows.Scan(&repo.ID, &repo.Name, &repo.Description, &repo.OwnerID, &repo.IsPublic, &repo.CreatedAt, &repo.UpdatedAt)
		if err != nil {
			return nil, err
		}
		repositories = append(repositories, &repo)
	}
	
	return repositories, nil
}

// UpdateRepository updates repository information
func UpdateRepository(id string, input RepositoryInput) (*Repository, error) {
	// Get the existing repository
	repo, err := GetRepositoryByID(id)
	if err != nil {
		return nil, err
	}
	
	if repo == nil {
		return nil, errors.New("repository not found")
	}
	
	// Update fields
	repo.Name = input.Name
	repo.Description = input.Description
	repo.IsPublic = input.IsPublic
	repo.UpdatedAt = time.Now()
	
	// Update the repository in the database
	_, err = config.DB.Exec(
		"UPDATE repositories SET name = $1, description = $2, is_public = $3, updated_at = $4 WHERE id = $5",
		repo.Name, repo.Description, repo.IsPublic, repo.UpdatedAt, repo.ID,
	)
	
	if err != nil {
		return nil, err
	}
	
	return repo, nil
}

// DeleteRepository removes a repository from the database and filesystem
func DeleteRepository(id string) error {
	// First get the repository details for filesystem deletion
	repo, err := GetRepositoryByID(id)
	if err != nil {
		return err
	}
	
	if repo == nil {
		return errors.New("repository not found")
	}
	
	// Delete from database first
	_, err = config.DB.Exec("DELETE FROM repositories WHERE id = $1", id)
	if err != nil {
		return err
	}
	
	// Then delete from filesystem
	err = deleteRepositoryFileSystem(repo.OwnerID, repo.Name)
	
	return err
}

// Helper function to create the filesystem structure for a repository
func createRepositoryFileSystem(ownerID, repoName string) error {
	// Get the base repositories directory
	reposPath := getRepositoriesBasePath()
	
	// Build the repository path
	repoPath := filepath.Join(reposPath, ownerID, repoName)
	
	// Create the directory
	err := os.MkdirAll(repoPath, 0755)
	if err != nil {
		return err
	}
	
	// Initialize a bare git repository
	// This would typically execute something like: git init --bare
	// For now, we'll just create a placeholder file
	placeholderPath := filepath.Join(repoPath, "README.md")
	err = os.WriteFile(placeholderPath, []byte("# "+repoName+"\n\nRepository created successfully."), 0644)
	
	return err
}

// Helper function to delete the filesystem structure for a repository
func deleteRepositoryFileSystem(ownerID, repoName string) error {
	// Get the repository path
	reposPath := getRepositoriesBasePath()
	repoPath := filepath.Join(reposPath, ownerID, repoName)
	
	// Delete the directory and all content
	return os.RemoveAll(repoPath)
}

// Helper function to get the base path for all repositories
func getRepositoriesBasePath() string {
	baseRepoPath := os.Getenv("REPOSITORIES_PATH")
	if baseRepoPath == "" {
		// Default to a subdirectory in the current working directory
		// In production, this should be set by environment variable
		dir, _ := os.Getwd()
		baseRepoPath = filepath.Join(dir, "repositories")
	}
	
	// Ensure the base directory exists
	os.MkdirAll(baseRepoPath, 0755)
	
	return baseRepoPath
}
