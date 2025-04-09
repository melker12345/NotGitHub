package models

import (
	"database/sql"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github-clone/config"
	"github-clone/utils"
	
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
	Owner       *User     `json:"owner,omitempty"` // Owner information
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
	
	// Get the username for this owner ID for SSH compatibility
	owner, err := GetUserByID(ownerID)
	if err != nil {
		return nil, fmt.Errorf("failed to get repository owner: %w", err)
	}
	
	// Create repository directory structure with username-based path
	// Ensure repository name has .git suffix
	repoName := input.Name
	if !strings.HasSuffix(repoName, ".git") {
		repoName = repoName + ".git"
	}
	
	// Get the base repositories directory
	baseRepoPath := os.Getenv("REPOSITORIES_PATH")
	if baseRepoPath == "" {
		// Default to a subdirectory in the current working directory
		dir, _ := os.Getwd()
		baseRepoPath = filepath.Join(dir, "repositories")
	}
	
	// Ensure the base directory and user directory exist
	userRepoPath := filepath.Join(baseRepoPath, owner.Username)
	if err := os.MkdirAll(userRepoPath, 0755); err != nil {
		return nil, fmt.Errorf("failed to create user repository directory: %w", err)
	}
	
	// Full path to the repository
	repoPath := filepath.Join(userRepoPath, repoName)
	
	// Initialize the Git repository
	err = utils.InitializeGitRepository(repoPath)
	if err != nil {
		return nil, err
	}
	
	// Set up repository hooks
	err = utils.CreateRepositoryHooks(repoPath)
	if err != nil {
		// If hooks creation fails, attempt to clean up the repository
		utils.DeleteGitRepository(repoPath)
		return nil, err
	}
	
	// Insert the repository into the database
	_, err = config.DB.Exec(
		"INSERT INTO repositories (id, name, description, owner_id, is_public, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
		repo.ID, repo.Name, repo.Description, repo.OwnerID, repo.IsPublic, repo.CreatedAt, repo.UpdatedAt,
	)
	
	if err != nil {
		// If database insertion fails, clean up the Git repository
		utils.DeleteGitRepository(repoPath)
		return nil, err
	}
	
	return repo, nil
}

// GetRepositoryByID fetches a repository by its ID
func GetRepositoryByID(id string) (*Repository, error) {
	query := `
		SELECT r.id, r.name, r.description, r.owner_id, r.is_public, r.created_at, r.updated_at,
		       u.id, u.username, u.email, u.created_at
		FROM repositories r
		LEFT JOIN users u ON r.owner_id = u.id
		WHERE r.id = ?
	`
	
	var repo Repository
	var owner User
	
	// Query the database
	err := config.DB.QueryRow(query, id).Scan(
		&repo.ID, &repo.Name, &repo.Description, &repo.OwnerID, &repo.IsPublic, &repo.CreatedAt, &repo.UpdatedAt,
		&owner.ID, &owner.Username, &owner.Email, &owner.CreatedAt,
	)
	
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil // No repository found
		}
		return nil, err
	}
	
	// Set the owner
	repo.Owner = &owner
	
	return &repo, nil
}

// GetRepositoryByOwnerAndName fetches a repository by owner ID and repository name
func GetRepositoryByOwnerAndName(ownerID, name string) (*Repository, error) {
	query := `
		SELECT r.id, r.name, r.description, r.owner_id, r.is_public, r.created_at, r.updated_at,
		       u.id, u.username, u.email, u.created_at
		FROM repositories r
		LEFT JOIN users u ON r.owner_id = u.id
		WHERE r.owner_id = ? AND r.name = ?
	`
	
	var repo Repository
	var owner User
	
	// Query the database
	err := config.DB.QueryRow(query, ownerID, name).Scan(
		&repo.ID, &repo.Name, &repo.Description, &repo.OwnerID, &repo.IsPublic, &repo.CreatedAt, &repo.UpdatedAt,
		&owner.ID, &owner.Username, &owner.Email, &owner.CreatedAt,
	)
	
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil // No repository found
		}
		return nil, err
	}
	
	// Set the owner
	repo.Owner = &owner
	
	return &repo, nil
}

// GetRepositoryByUsernameAndName fetches a repository by username and repository name
func GetRepositoryByUsernameAndName(username, repoName string) (*Repository, error) {
	query := `
		SELECT r.id, r.name, r.description, r.owner_id, r.is_public, r.created_at, r.updated_at,
		       u.id, u.username, u.email, u.created_at
		FROM repositories r
		JOIN users u ON r.owner_id = u.id
		WHERE u.username = ? AND r.name = ?
	`
	
	var repo Repository
	var owner User
	
	// Query the database
	err := config.DB.QueryRow(query, username, repoName).Scan(
		&repo.ID, &repo.Name, &repo.Description, &repo.OwnerID, &repo.IsPublic, &repo.CreatedAt, &repo.UpdatedAt,
		&owner.ID, &owner.Username, &owner.Email, &owner.CreatedAt,
	)
	
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil // No repository found
		}
		return nil, err
	}
	
	// Set the owner
	repo.Owner = &owner
	
	return &repo, nil
}

// GetUserRepositories fetches all repositories owned by a user
func GetUserRepositories(userID string) ([]*Repository, error) {
	query := `
		SELECT r.id, r.name, r.description, r.owner_id, r.is_public, r.created_at, r.updated_at,
		       u.id, u.username, u.email, u.created_at
		FROM repositories r
		LEFT JOIN users u ON r.owner_id = u.id
		WHERE r.owner_id = ?
		ORDER BY r.created_at DESC
	`
	
	rows, err := config.DB.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	
	repositories := []*Repository{}
	
	for rows.Next() {
		var repo Repository
		var owner User
		
		err := rows.Scan(
			&repo.ID, &repo.Name, &repo.Description, &repo.OwnerID, &repo.IsPublic, &repo.CreatedAt, &repo.UpdatedAt,
			&owner.ID, &owner.Username, &owner.Email, &owner.CreatedAt,
		)
		
		if err != nil {
			return nil, err
		}
		
		// Set the owner
		repo.Owner = &owner
		
		repositories = append(repositories, &repo)
	}
	
	if err = rows.Err(); err != nil {
		return nil, err
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
		"UPDATE repositories SET name = ?, description = ?, is_public = ?, updated_at = ? WHERE id = ?",
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
	_, err = config.DB.Exec("DELETE FROM repositories WHERE id = ?", id)
	if err != nil {
		return err
	}
	
	// Then delete from filesystem
	repoPath := utils.GetRepositoryPath(repo.OwnerID, repo.Name)
	err = utils.DeleteGitRepository(repoPath)
	
	return err
}
