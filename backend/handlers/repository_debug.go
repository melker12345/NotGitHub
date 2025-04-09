package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github-clone/models"

	"github.com/gorilla/mux"
)

// DebugRepositoryPath is a debug endpoint to verify repository paths
func DebugRepositoryPath(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	username := vars["username"]
	repoName := vars["reponame"]

	// Get repository info from database
	repo, err := models.GetRepositoryByUsernameAndName(username, repoName)
	if err != nil {
		http.Error(w, fmt.Sprintf("Database error: %v", err), http.StatusInternalServerError)
		return
	}

	if repo == nil {
		http.Error(w, "Repository not found in database", http.StatusNotFound)
		return
	}

	// Get base repository path
	baseRepoPath := os.Getenv("REPOSITORIES_PATH")
	if baseRepoPath == "" {
		dir, _ := os.Getwd()
		baseRepoPath = filepath.Join(dir, "repositories")
	}

	// Check username-based path
	gitRepoName := repoName
	if !strings.HasSuffix(gitRepoName, ".git") {
		gitRepoName += ".git"
	}

	usernamePath := filepath.Join(baseRepoPath, username, gitRepoName)
	useridPath := filepath.Join(baseRepoPath, repo.OwnerID, gitRepoName)

	// Check all possible repository paths
	pathInfo := map[string]interface{}{
		"repository": map[string]string{
			"id":       repo.ID,
			"name":     repo.Name,
			"owner_id": repo.OwnerID,
			"username": username,
		},
		"paths": map[string]interface{}{
			"username_path": map[string]interface{}{
				"path":  usernamePath,
				"exists": fileExists(usernamePath),
			},
			"userid_path": map[string]interface{}{
				"path":  useridPath,
				"exists": fileExists(useridPath),
			},
		},
	}

	// Check git repository details if a path exists
	if pathInfo["paths"].(map[string]interface{})["username_path"].(map[string]interface{})["exists"].(bool) {
		pathInfo["git_info"] = getGitInfo(usernamePath)
		pathInfo["contents"] = listDirectory(usernamePath)
	} else if pathInfo["paths"].(map[string]interface{})["userid_path"].(map[string]interface{})["exists"].(bool) {
		pathInfo["git_info"] = getGitInfo(useridPath)
		pathInfo["contents"] = listDirectory(useridPath)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(pathInfo)
}

// Helper function to check if a file exists
func fileExists(path string) bool {
	_, err := os.Stat(path)
	return !os.IsNotExist(err)
}

// Get git repository information
func getGitInfo(repoPath string) map[string]interface{} {
	// Check if there are any branches
	cmd := exec.Command("git", "-C", repoPath, "branch")
	output, err := cmd.CombinedOutput()
	
	branches := []string{}
	if err == nil {
		lines := strings.Split(string(output), "\n")
		for _, line := range lines {
			line = strings.TrimSpace(line)
			if line != "" {
				// Remove the asterisk from current branch
				branch := strings.TrimPrefix(line, "* ")
				branches = append(branches, branch)
			}
		}
	}

	// Check commit count
	cmd = exec.Command("git", "-C", repoPath, "rev-list", "--count", "--all")
	output, err = cmd.CombinedOutput()
	
	commitCount := 0
	if err == nil {
		fmt.Sscanf(string(output), "%d", &commitCount)
	}

	return map[string]interface{}{
		"is_git_repo": fileExists(filepath.Join(repoPath, "HEAD")),
		"branches":    branches,
		"commit_count": commitCount,
	}
}

// List directory contents
func listDirectory(path string) []string {
	entries, err := os.ReadDir(path)
	if err != nil {
		return []string{fmt.Sprintf("Error reading directory: %v", err)}
	}

	fileList := []string{}
	for _, entry := range entries {
		fileList = append(fileList, entry.Name())
	}
	return fileList
}
