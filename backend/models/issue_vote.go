package models

import (
	"database/sql"
	"errors"
	"time"
	
	"github-clone/config"
)

// IssueVote represents a user's vote on an issue (upvote or downvote)
type IssueVote struct {
	IssueID   string    `json:"issue_id"`
	UserID    string    `json:"user_id"`
	Vote      int       `json:"vote"` // 1 for upvote, -1 for downvote
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// VoteInput is used for creating or updating votes
type VoteInput struct {
	Vote int `json:"vote"` // 1 for upvote, -1 for downvote
}

// VoteOnIssue creates or updates a user's vote on an issue
func VoteOnIssue(issueID string, userID string, input VoteInput) (*IssueVote, error) {
	// Validate vote value
	if input.Vote != 1 && input.Vote != -1 {
		return nil, errors.New("vote must be either 1 (upvote) or -1 (downvote)")
	}
	
	now := time.Now()
	
	// Check if the user has already voted on this issue
	var existingVote IssueVote
	var exists bool
	
	err := config.DB.QueryRow(`
		SELECT issue_id, user_id, vote, created_at, updated_at
		FROM issue_votes
		WHERE issue_id = ? AND user_id = ?
	`, issueID, userID).Scan(
		&existingVote.IssueID, &existingVote.UserID, &existingVote.Vote, &existingVote.CreatedAt, &existingVote.UpdatedAt,
	)
	
	if err != nil {
		if err != sql.ErrNoRows {
			return nil, err
		}
		// No existing vote, create a new one
		exists = false
	} else {
		exists = true
	}
	
	// Create or update the vote
	vote := &IssueVote{
		IssueID:   issueID,
		UserID:    userID,
		Vote:      input.Vote,
		CreatedAt: now,
		UpdatedAt: now,
	}
	
	if exists {
		// If vote is the same, no need to update
		if existingVote.Vote == input.Vote {
			return &existingVote, nil
		}
		
		// Update existing vote
		_, err = config.DB.Exec(`
			UPDATE issue_votes
			SET vote = ?, updated_at = ?
			WHERE issue_id = ? AND user_id = ?
		`, vote.Vote, vote.UpdatedAt, vote.IssueID, vote.UserID)
		
		if err != nil {
			return nil, err
		}
		
		vote.CreatedAt = existingVote.CreatedAt
	} else {
		// Insert new vote
		_, err = config.DB.Exec(`
			INSERT INTO issue_votes (issue_id, user_id, vote, created_at, updated_at)
			VALUES (?, ?, ?, ?, ?)
		`, vote.IssueID, vote.UserID, vote.Vote, vote.CreatedAt, vote.UpdatedAt)
		
		if err != nil {
			return nil, err
		}
	}
	
	return vote, nil
}

// RemoveVote removes a user's vote from an issue
func RemoveVote(issueID string, userID string) error {
	result, err := config.DB.Exec(`
		DELETE FROM issue_votes
		WHERE issue_id = ? AND user_id = ?
	`, issueID, userID)
	
	if err != nil {
		return err
	}
	
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	
	if rowsAffected == 0 {
		return errors.New("vote not found")
	}
	
	return nil
}

// GetIssueVotes retrieves all votes for an issue
func GetIssueVotes(issueID string) (int, error) {
	var voteSum int
	
	err := config.DB.QueryRow(`
		SELECT COALESCE(SUM(vote), 0)
		FROM issue_votes
		WHERE issue_id = ?
	`, issueID).Scan(&voteSum)
	
	if err != nil {
		return 0, err
	}
	
	return voteSum, nil
}
