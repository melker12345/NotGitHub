package handlers

import (
	"encoding/json"
	"net/http"
	"strings"
	
	"github-clone/models"
	"github-clone/utils"
)

// VoteOnIssue handles POST /api/repos/:owner/:repo/issues/:id/vote
func VoteOnIssue(w http.ResponseWriter, r *http.Request) {
	// Only allow POST method
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	
	// Extract owner, repo, and issue ID from URL path
	pathParts := strings.Split(r.URL.Path, "/")
	if len(pathParts) < 7 {
		http.Error(w, "Invalid URL format", http.StatusBadRequest)
		return
	}
	
	owner := pathParts[3] // /api/repos/{owner}/{repo}/issues/{id}/vote
	repoName := pathParts[4]
	issueID := pathParts[6]
	
	// Get current user from context
	currentUser, err := utils.GetUserFromContext(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	
	// Get repository
	repository, err := models.GetRepositoryByName(owner, repoName)
	if err != nil {
		http.Error(w, "Repository not found", http.StatusNotFound)
		return
	}
	
	// Check if the repository is public or if the user has access to it
	if !repository.IsPublic && repository.OwnerID != currentUser.ID {
		http.Error(w, "Unauthorized to vote on issues in this repository", http.StatusForbidden)
		return
	}
	
	// Get issue
	issue, err := models.GetIssue(issueID, currentUser.Username)
	if err != nil {
		http.Error(w, "Issue not found", http.StatusNotFound)
		return
	}
	
	// Check if the issue belongs to the repository
	if issue.RepositoryID != repository.ID {
		http.Error(w, "Issue not found in this repository", http.StatusNotFound)
		return
	}
	
	// Parse the request body
	var input models.VoteInput
	err = json.NewDecoder(r.Body).Decode(&input)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	
	// Apply the vote
	vote, err := models.VoteOnIssue(issueID, currentUser.ID, input)
	if err != nil {
		http.Error(w, "Failed to vote on issue: "+err.Error(), http.StatusInternalServerError)
		return
	}
	
	// Return the vote as JSON
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(vote)
}

// RemoveVoteFromIssue handles DELETE /api/repos/:owner/:repo/issues/:id/vote
func RemoveVoteFromIssue(w http.ResponseWriter, r *http.Request) {
	// Only allow DELETE method
	if r.Method != http.MethodDelete {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	
	// Extract owner, repo, and issue ID from URL path
	pathParts := strings.Split(r.URL.Path, "/")
	if len(pathParts) < 7 {
		http.Error(w, "Invalid URL format", http.StatusBadRequest)
		return
	}
	
	owner := pathParts[3] // /api/repos/{owner}/{repo}/issues/{id}/vote
	repoName := pathParts[4]
	issueID := pathParts[6]
	
	// Get current user from context
	currentUser, err := utils.GetUserFromContext(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	
	// Get repository
	repository, err := models.GetRepositoryByName(owner, repoName)
	if err != nil {
		http.Error(w, "Repository not found", http.StatusNotFound)
		return
	}
	
	// Check if the repository is public or if the user has access to it
	if !repository.IsPublic && repository.OwnerID != currentUser.ID {
		http.Error(w, "Unauthorized to remove vote from issues in this repository", http.StatusForbidden)
		return
	}
	
	// Get issue
	issue, err := models.GetIssue(issueID, currentUser.Username)
	if err != nil {
		http.Error(w, "Issue not found", http.StatusNotFound)
		return
	}
	
	// Check if the issue belongs to the repository
	if issue.RepositoryID != repository.ID {
		http.Error(w, "Issue not found in this repository", http.StatusNotFound)
		return
	}
	
	// Remove the vote
	err = models.RemoveVote(issueID, currentUser.ID)
	if err != nil {
		http.Error(w, "Failed to remove vote from issue: "+err.Error(), http.StatusInternalServerError)
		return
	}
	
	// Return success
	w.WriteHeader(http.StatusNoContent)
}
