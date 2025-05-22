package handlers

import (
	"encoding/json"
	"fmt"
	"github-clone/utils"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/gorilla/mux"
)

type UserStats struct {
	TotalRepositories  int    `json:"total_repositories"`
	PublicRepositories int    `json:"public_repositories"`
	TotalCommits       int    `json:"total_commits"`
	TotalLinesOfCode   int    `json:"total_lines_of_code"`
	JoinedDate         string `json:"joined_date"`
}

// GetUserStats handles the requests to get user statistics
func GetUserStats(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	username := vars["username"]

	if username == "" {
		http.Error(w, "Username is required", http.StatusBadRequest)
		return
	}

	stats, err := getUserStats(username)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error getting user stats: %v", err), http.StatusInternalServerError)
		return
	}

	// Set content type and response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stats)
}

// getUserStats calculates statistics for a user
func getUserStats(username string) (UserStats, error) {
	stats := UserStats{}

	// Get user's repositories
	repos, err := utils.GetUserRepositoriesFromDB(username)
	if err != nil {
		// Instead of returning early, just log the error and continue with empty repos
		fmt.Printf("Error fetching repositories for user %s: %v\n", username, err)
		repos = []utils.Repository{}
	}

	// Count repositories
	stats.TotalRepositories = len(repos)

	// Count public repositories
	for _, repo := range repos {
		if repo.IsPublic {
			stats.PublicRepositories++
		}
	}

	// Calculate total commits and lines of code
	totalCommits := 0
	totalLinesOfCode := 0

	// Get base repository storage path - using "repositories" folder with .git suffix
	dir, _ := os.Getwd()
	repoBasePath := filepath.Join(dir, "repositories")

	for _, repo := range repos {
		// Count commits - safely handle errors
		commits, err := utils.GetRepositoryCommitCount(username, repo.Name)
		if err != nil {
			fmt.Printf("Error counting commits for %s/%s: %v\n", username, repo.Name, err)
			// Continue with next repo, don't add any commits for this one
		} else {
			totalCommits += commits
		}

		// Count lines of code - safely handle errors
		// Append .git to the repository name as seen in the file structure
		repoPath := filepath.Join(repoBasePath, username, repo.Name+".git")
		lines, err := countLinesOfCode(repoPath)
		if err != nil {
			fmt.Printf("Error counting lines for %s/%s: %v\n", username, repo.Name, err)
			// Continue with next repo, don't add any lines for this one
		} else {
			totalLinesOfCode += lines
		}
	}

	stats.TotalCommits = totalCommits
	stats.TotalLinesOfCode = totalLinesOfCode

	// Get user's joined date (from first repository created date for simplicity)
	if len(repos) > 0 {
		stats.JoinedDate = repos[0].CreatedAt.Format("2006-01-02")
	} else {
		// Default to current date if no repositories
		stats.JoinedDate = time.Now().Format("2006-01-02")
	}

	return stats, nil
}

// countLinesOfCode counts the lines of code in a repository using git commands
func countLinesOfCode(repoPath string) (int, error) {
	// For bare repositories, we to use git commands to get the stats
	// This command gets the latest commit and counts total lines in all files
	cmd := exec.Command("git", "-C", repoPath, "ls-tree", "-r", "HEAD", "--name-only")
	files, err := cmd.Output()
	if err != nil {
		return 0, fmt.Errorf("error listing files: %v", err)
	}

	totalLines := 0
	filenames := strings.Split(string(files), "\n")

	// Process each file
	for _, filename := range filenames {
		filename = strings.TrimSpace(filename)
		if filename == "" {
			continue
		}

		ext := strings.ToLower(filepath.Ext(filename))
		if !isCodeFile(ext) {
			continue
		}

		// Use git show to get the file content and count lines
		showCmd := exec.Command("git", "-C", repoPath, "show", fmt.Sprintf("HEAD:%s", filename))
		content, err := showCmd.Output()
		if err != nil {
			continue
		}

		lines := len(strings.Split(string(content), "\n"))
		totalLines += lines
	}

	return totalLines, nil
}

func isCodeFile(ext string) bool {
	codeExtensions := []string{
		".go", ".js", ".jsx", ".ts", ".tsx", ".html", ".css", ".scss",
		".py", ".java", ".c", ".cpp", ".h", ".hpp", ".cs", ".php", ".rb",
		".swift", ".kt", ".rs", ".sh", ".bash", ".json", ".yml", ".yaml",
		".md", ".txt",
	}

	for _, codeExt := range codeExtensions {
		if ext == codeExt {
			return true
		}
	}
	return false
}

func countFileLines(filePath string) (int, error) {
	content, err := os.ReadFile(filePath)
	if err != nil {
		return 0, err
	}

	return len(strings.Split(string(content), "\n")), nil
}
