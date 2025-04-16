package models

import (
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"
	
	"github-clone/config"
	
	"github.com/google/uuid"
)

// Issue represents a repository issue in the system
type Issue struct {
	ID          string         `json:"id"`
	RepositoryID string        `json:"repository_id"`
	Title       string         `json:"title"`
	Description string         `json:"description"`
	CreatedBy   string         `json:"created_by"` // Username of creator
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	ClosedAt    sql.NullTime   `json:"closed_at"`
	ClosedBy    sql.NullString `json:"closed_by"` // Username of who closed it
	IsOpen      bool           `json:"is_open"`
	
	// Additional fields populated when retrieving an issue
	Creator     *User          `json:"creator,omitempty"`
	Repository  *Repository    `json:"repository,omitempty"`
	VoteCount   int            `json:"vote_count,omitempty"`
	UserVote    *int           `json:"user_vote,omitempty"` // Current user's vote (1, -1, or nil)
}

// IssueInput is used for creating or updating issues
type IssueInput struct {
	Title       string `json:"title"`
	Description string `json:"description"`
}

// CreateIssue creates a new issue in the database
func CreateIssue(repoID string, createdBy string, input IssueInput) (*Issue, error) {
	// Generate a unique ID
	id := uuid.New().String()
	now := time.Now()
	
	// Create the issue struct
	issue := &Issue{
		ID:          id,
		RepositoryID: repoID,
		Title:       input.Title,
		Description: input.Description,
		CreatedBy:   createdBy,
		CreatedAt:   now,
		UpdatedAt:   now,
		IsOpen:      true,
	}
	
	// Insert the issue into the database
	_, err := config.DB.Exec(`
		INSERT INTO issues (id, repository_id, title, description, created_by, created_at, updated_at, is_open)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`, issue.ID, issue.RepositoryID, issue.Title, issue.Description, issue.CreatedBy, issue.CreatedAt, issue.UpdatedAt, issue.IsOpen)
	
	if err != nil {
		return nil, err
	}
	
	return issue, nil
}

// GetIssue retrieves a specific issue by ID
func GetIssue(issueID string, currentUsername string) (*Issue, error) {
	var issue Issue
	
	// Query to get issue details along with vote count
	row := config.DB.QueryRow(`
		SELECT 
			i.id, i.repository_id, i.title, i.description, 
			i.created_by, i.created_at, i.updated_at, 
			i.closed_at, i.closed_by, i.is_open,
			COALESCE(SUM(v.vote), 0) AS vote_count
		FROM issues i
		LEFT JOIN issue_votes v ON i.id = v.issue_id
		WHERE i.id = ?
		GROUP BY i.id
	`, issueID)
	
	var voteCount int
	err := row.Scan(
		&issue.ID, &issue.RepositoryID, &issue.Title, &issue.Description,
		&issue.CreatedBy, &issue.CreatedAt, &issue.UpdatedAt,
		&issue.ClosedAt, &issue.ClosedBy, &issue.IsOpen,
		&voteCount,
	)
	
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("issue not found")
		}
		return nil, err
	}
	
	issue.VoteCount = voteCount
	
	// Get the current user's vote if they're logged in
	if currentUsername != "" {
		var userVote int
		err = config.DB.QueryRow(`
			SELECT vote FROM issue_votes
			WHERE issue_id = ? AND user_id = (SELECT id FROM users WHERE username = ?)
		`, issueID, currentUsername).Scan(&userVote)
		
		if err == nil {
			issue.UserVote = &userVote
		}
	}
	
	return &issue, nil
}

// GetRepositoryIssuesFiltered retrieves issues for a repository with pagination and optional filtering by open/closed status
func GetRepositoryIssuesFiltered(repoID string, limit, offset int, currentUsername string, isOpen *bool) ([]*Issue, error) {
	// Build the query with optional filter
	baseQuery := `
		SELECT 
			i.id, i.repository_id, i.title, i.description, 
			i.created_by, i.created_at, i.updated_at, 
			i.closed_at, i.closed_by, i.is_open,
			COALESCE(SUM(v.vote), 0) AS vote_count
		FROM issues i
		LEFT JOIN issue_votes v ON i.id = v.issue_id
		WHERE i.repository_id = ?
	`
	
	// Add filter for open/closed status if provided
	args := []interface{}{repoID}
	if isOpen != nil {
		baseQuery += " AND i.is_open = ?"
		args = append(args, *isOpen)
	}
	
	// Complete the query
	query := baseQuery + `
		GROUP BY i.id
		ORDER BY i.created_at DESC
		LIMIT ? OFFSET ?
	`
	
	// Add pagination parameters
	args = append(args, limit, offset)

	// Execute the query
	rows, err := config.DB.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	// Process the results
	issues := []*Issue{}
	for rows.Next() {
		var issue Issue
		var closedAt sql.NullTime
		var closedBy sql.NullString
		var voteCount int

		err := rows.Scan(
			&issue.ID, &issue.RepositoryID, &issue.Title, &issue.Description,
			&issue.CreatedBy, &issue.CreatedAt, &issue.UpdatedAt,
			&closedAt, &closedBy, &issue.IsOpen, &voteCount,
		)
		if err != nil {
			return nil, err
		}

		issue.ClosedAt = closedAt
		issue.ClosedBy = closedBy
		issue.VoteCount = voteCount

		issues = append(issues, &issue)
	}

	// If we have a current user, get their votes for these issues
	if currentUsername != "" && len(issues) > 0 {
		// Build a list of issue IDs
		issueIDs := make([]string, len(issues))
		for i, issue := range issues {
			issueIDs[i] = issue.ID
		}

		// Get the user's votes for these issues
		placeholders := strings.Repeat("?,", len(issueIDs))
		placeholders = placeholders[:len(placeholders)-1] // Remove trailing comma

		voteQuery := fmt.Sprintf(`
			SELECT issue_id, vote FROM issue_votes
			WHERE username = ? AND issue_id IN (%s)
		`, placeholders)

		// Create args for the vote query
		voteArgs := []interface{}{currentUsername}
		for _, id := range issueIDs {
			voteArgs = append(voteArgs, id)
		}

		voteRows, err := config.DB.Query(voteQuery, voteArgs...)
		if err == nil {
			defer voteRows.Close()
			
			// Create a map of issue ID to vote
			voteMap := make(map[string]int)
			for voteRows.Next() {
				var issueID string
				var vote int
				if err := voteRows.Scan(&issueID, &vote); err == nil {
					voteMap[issueID] = vote
				}
			}
			
			// Assign votes to issues
			for _, issue := range issues {
				if vote, ok := voteMap[issue.ID]; ok {
					issue.UserVote = &vote
				}
			}
		}
	}
	
	return issues, nil
}

// GetRepositoryIssues retrieves all issues for a repository with pagination
// This is kept for backward compatibility
func GetRepositoryIssues(repoID string, limit, offset int, currentUsername string) ([]*Issue, error) {
	// Call the new filtered function with no filter
	return GetRepositoryIssuesFiltered(repoID, limit, offset, currentUsername, nil)
}

// CloseIssue changes an issue's status to closed
func CloseIssue(issueID string, closedBy string) error {
	now := time.Now()
	
	result, err := config.DB.Exec(`
		UPDATE issues
		SET is_open = 0, closed_at = ?, closed_by = ?, updated_at = ?
		WHERE id = ?
	`, now, closedBy, now, issueID)
	
	if err != nil {
		return err
	}
	
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	
	if rowsAffected == 0 {
		return errors.New("issue not found")
	}
	
	return nil
}

// ReopenIssue changes an issue's status to open
func ReopenIssue(issueID string) error {
	updatedAt := time.Now()
	
	result, err := config.DB.Exec(`
		UPDATE issues
		SET is_open = 1, closed_at = NULL, closed_by = NULL, updated_at = ?
		WHERE id = ?
	`, updatedAt, issueID)
	
	if err != nil {
		return err
	}
	
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	
	if rowsAffected == 0 {
		return errors.New("issue not found")
	}
	
	return nil
}
