package models

import (
	"database/sql"
	"errors"
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
	
	// Create repository directory structure and initialize Git repository
	repoPath := utils.GetRepositoryPath(ownerID, input.Name)
	err := utils.InitializeGitRepository(repoPath)
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
	var repo Repository
	
	err := config.DB.QueryRow(
		"SELECT id, name, description, owner_id, is_public, created_at, updated_at FROM repositories WHERE id = ?",
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
		"SELECT id, name, description, owner_id, is_public, created_at, updated_at FROM repositories WHERE owner_id = ? AND name = ?",
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
		"SELECT id, name, description, owner_id, is_public, created_at, updated_at FROM repositories WHERE owner_id = ? ORDER BY created_at DESC",
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
