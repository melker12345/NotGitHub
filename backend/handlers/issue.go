package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	
	"github-clone/models"
	"github-clone/utils"
)

// CreateIssue handles POST /api/repos/:owner/:repo/issues
func CreateIssue(w http.ResponseWriter, r *http.Request) {
	// Only allow POST method
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	
	// Extract owner and repo from URL path
	pathParts := strings.Split(r.URL.Path, "/")
	if len(pathParts) < 5 {
		http.Error(w, "Invalid URL format", http.StatusBadRequest)
		return
	}
	
	owner := pathParts[3] // /api/repos/{owner}/{repo}/...
	repo := pathParts[4]
	
	// Get current user from context
	currentUser, err := utils.GetUserFromContext(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	
	// First, check if the repository exists and if the user has access to it
	repository, err := models.GetRepositoryByName(owner, repo)
	if err != nil {
		http.Error(w, "Repository not found", http.StatusNotFound)
		return
	}
	
	// Check if user has permission to create issues
	// Users can create issues if they own the repo or if the repo is public
	hasPermission := repository.OwnerID == currentUser.ID || repository.IsPublic
	if !hasPermission {
		http.Error(w, "Unauthorized to create issues in this repository", http.StatusForbidden)
		return
	}
	
	// Parse the request body
	var input models.IssueInput
	err = json.NewDecoder(r.Body).Decode(&input)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	
	// Validate required fields
	if input.Title == "" {
		http.Error(w, "Title is required", http.StatusBadRequest)
		return
	}
	
	// Create the issue
	issue, err := models.CreateIssue(repository.ID, currentUser.Username, input)
	if err != nil {
		http.Error(w, "Failed to create issue: "+err.Error(), http.StatusInternalServerError)
		return
	}
	
	// Return the created issue as JSON
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(issue)
}

// GetRepositoryIssues handles GET /api/repos/:owner/:repo/issues
func GetRepositoryIssues(w http.ResponseWriter, r *http.Request) {
	// Only allow GET method
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	
	// Extract owner and repo from URL path
	pathParts := strings.Split(r.URL.Path, "/")
	if len(pathParts) < 5 {
		http.Error(w, "Invalid URL format", http.StatusBadRequest)
		return
	}
	
	owner := pathParts[3] // /api/repos/{owner}/{repo}/...
	repo := pathParts[4]
	
	// Get current user from context (if authenticated)
	var currentUsername string
	currentUser, err := utils.GetUserFromContext(r)
	if err == nil && currentUser != nil {
		currentUsername = currentUser.Username
	}
	
	// Get repository
	repository, err := models.GetRepositoryByName(owner, repo)
	if err != nil {
		http.Error(w, "Repository not found", http.StatusNotFound)
		return
	}
	
	// Check if the repository is public or if the user has access to it
	if !repository.IsPublic && (currentUser == nil || repository.OwnerID != currentUser.ID) {
		http.Error(w, "Unauthorized to view issues in this repository", http.StatusForbidden)
		return
	}
	
	// Get pagination parameters
	limit := 10 // Default limit
	offset := 0 // Default offset
	
	limitParam := r.URL.Query().Get("limit")
	if limitParam != "" {
		parsedLimit, err := strconv.Atoi(limitParam)
		if err == nil && parsedLimit > 0 {
			limit = parsedLimit
		}
	}
	
	offsetParam := r.URL.Query().Get("offset")
	if offsetParam != "" {
		parsedOffset, err := strconv.Atoi(offsetParam)
		if err == nil && parsedOffset >= 0 {
			offset = parsedOffset
		}
	}
	
	// Get issues
	issues, err := models.GetRepositoryIssues(repository.ID, limit, offset, currentUsername)
	if err != nil {
		http.Error(w, "Failed to get issues: "+err.Error(), http.StatusInternalServerError)
		return
	}
	
	// Return the issues as JSON
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(issues)
}

// GetIssue handles GET /api/repos/:owner/:repo/issues/:id
func GetIssue(w http.ResponseWriter, r *http.Request) {
	// Only allow GET method
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	
	// Extract owner, repo, and issue ID from URL path
	pathParts := strings.Split(r.URL.Path, "/")
	if len(pathParts) < 6 {
		http.Error(w, "Invalid URL format", http.StatusBadRequest)
		return
	}
	
	owner := pathParts[3] // /api/repos/{owner}/{repo}/issues/{id}
	repoName := pathParts[4]
	issueID := pathParts[6]
	
	// Get current user from context (if authenticated)
	var currentUsername string
	currentUser, err := utils.GetUserFromContext(r)
	if err == nil && currentUser != nil {
		currentUsername = currentUser.Username
	}
	
	// Get repository
	repository, err := models.GetRepositoryByName(owner, repoName)
	if err != nil {
		http.Error(w, "Repository not found", http.StatusNotFound)
		return
	}
	
	// Check if the repository is public or if the user has access to it
	if !repository.IsPublic && (currentUser == nil || repository.OwnerID != currentUser.ID) {
		http.Error(w, "Unauthorized to view issues in this repository", http.StatusForbidden)
		return
	}
	
	// Get issue
	issue, err := models.GetIssue(issueID, currentUsername)
	if err != nil {
		http.Error(w, "Issue not found", http.StatusNotFound)
		return
	}
	
	// Check if the issue belongs to the repository
	if issue.RepositoryID != repository.ID {
		http.Error(w, "Issue not found in this repository", http.StatusNotFound)
		return
	}
	
	// Return the issue as JSON
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(issue)
}

// UpdateIssueStatus handles PATCH /api/repos/:owner/:repo/issues/:id
func UpdateIssueStatus(w http.ResponseWriter, r *http.Request) {
	// Only allow PATCH method
	if r.Method != http.MethodPatch {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	
	// Extract owner, repo, and issue ID from URL path
	pathParts := strings.Split(r.URL.Path, "/")
	if len(pathParts) < 6 {
		http.Error(w, "Invalid URL format", http.StatusBadRequest)
		return
	}
	
	owner := pathParts[3] // /api/repos/{owner}/{repo}/issues/{id}
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
	
	// Check if user has permission to update issues (only repo owner can update issues)
	if repository.OwnerID != currentUser.ID {
		http.Error(w, "Unauthorized to update issues in this repository", http.StatusForbidden)
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
	var input struct {
		IsOpen bool `json:"is_open"`
	}
	err = json.NewDecoder(r.Body).Decode(&input)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	
	// Update the issue status
	if input.IsOpen {
		err = models.ReopenIssue(issueID)
	} else {
		err = models.CloseIssue(issueID, currentUser.Username)
	}
	
	if err != nil {
		http.Error(w, "Failed to update issue: "+err.Error(), http.StatusInternalServerError)
		return
	}
	
	// Get the updated issue
	updatedIssue, err := models.GetIssue(issueID, currentUser.Username)
	if err != nil {
		http.Error(w, "Failed to retrieve updated issue", http.StatusInternalServerError)
		return
	}
	
	// Return the updated issue as JSON
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(updatedIssue)
}
