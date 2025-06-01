package models

import (
	"github-clone/config"
)

// GetPublicRepositories fetches all public repositories with pagination
// If requestingUserID is provided, it will include private repositories owned by that user
func GetPublicRepositories(limit, offset int, requestingUserID string, sort string) ([]*Repository, error) {
	var query string
	var args []interface{}

	orderByClause := "ORDER BY r.created_at DESC" // Default to newest
	if sort == "oldest" {
		orderByClause = "ORDER BY r.created_at ASC"
	}

	if requestingUserID != "" {
		// If user is authenticated, show public repos + their own private repos
		query = `
			SELECT r.id, r.name, r.description, r.owner_id, r.is_public, r.created_at, r.updated_at,
				u.id, u.username, u.email, u.created_at
			FROM repositories r
			LEFT JOIN users u ON r.owner_id = u.id
			WHERE r.is_public = 1 OR r.owner_id = ?
			` + orderByClause + `
			LIMIT ? OFFSET ?
		`
		args = []interface{}{requestingUserID, limit, offset}
	} else {
		// If no user is authenticated, only show public repos
		query = `
			SELECT r.id, r.name, r.description, r.owner_id, r.is_public, r.created_at, r.updated_at,
				u.id, u.username, u.email, u.created_at
			FROM repositories r
			LEFT JOIN users u ON r.owner_id = u.id
			WHERE r.is_public = 1
			` + orderByClause + `
			LIMIT ? OFFSET ?
		`
		args = []interface{}{limit, offset}
	}

	rows, err := config.DB.Query(query, args...)
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

// GetUserPublicRepositories fetches public repositories for a specific user
// If requestingUserID matches the username's user ID, it will include private repositories
func GetUserPublicRepositories(username string, limit, offset int, requestingUserID string, sort string) ([]*Repository, error) {
	// First, get the user ID for the username
	var userID string
	err := config.DB.QueryRow("SELECT id FROM users WHERE username = ?", username).Scan(&userID)
	if err != nil {
		return nil, err
	}

	var query string
	var args []interface{}

	orderByClause := "ORDER BY r.created_at DESC" // Default to newest
	if sort == "oldest" {
		orderByClause = "ORDER BY r.created_at ASC"
	}

	if requestingUserID == userID {
		// If the requesting user is the owner, show all repos (public and private)
		query = `
			SELECT r.id, r.name, r.description, r.owner_id, r.is_public, r.created_at, r.updated_at,
				u.id, u.username, u.email, u.created_at
			FROM repositories r
			LEFT JOIN users u ON r.owner_id = u.id
			WHERE r.owner_id = ?
			` + orderByClause + `
			LIMIT ? OFFSET ?
		`
		args = []interface{}{userID, limit, offset}
	} else {
		// Otherwise, only show public repos
		query = `
			SELECT r.id, r.name, r.description, r.owner_id, r.is_public, r.created_at, r.updated_at,
				u.id, u.username, u.email, u.created_at
			FROM repositories r
			LEFT JOIN users u ON r.owner_id = u.id
			WHERE r.owner_id = ? AND r.is_public = 1
			` + orderByClause + `
			LIMIT ? OFFSET ?
		`
		args = []interface{}{userID, limit, offset}
	}

	rows, err := config.DB.Query(query, args...)
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
