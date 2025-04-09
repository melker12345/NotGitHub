package utils

import (
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

// InitializeGitRepository initializes a bare Git repository at the specified path
func InitializeGitRepository(repoPath string) error {
	// Create the directory if it doesn't exist
	if err := os.MkdirAll(repoPath, 0755); err != nil {
		return fmt.Errorf("failed to create repository directory: %w", err)
	}

	// Initialize bare Git repository
	cmd := exec.Command("git", "init", "--bare")
	cmd.Dir = repoPath
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("failed to initialize Git repository: %w\nOutput: %s", err, string(output))
	}

	log.Printf("Initialized bare Git repository at %s", repoPath)
	return nil
}

// GetRepositoryPath returns the filesystem path for a repository
func GetRepositoryPath(ownerID, repoName string) string {
	// Get the base repositories directory
	baseRepoPath := os.Getenv("REPOSITORIES_PATH")
	if baseRepoPath == "" {
		// Default to a subdirectory in the current working directory
		dir, _ := os.Getwd()
		baseRepoPath = filepath.Join(dir, "repositories")
	}
	
	// Ensure the base directory exists
	os.MkdirAll(baseRepoPath, 0755)
	
	// Format repository names consistently
	if !strings.HasSuffix(repoName, ".git") {
		repoName = repoName + ".git"
	}
	
	// Construct the repository path using ownerID
	// This approach uses ownerID to maintain backward compatibility
	return filepath.Join(baseRepoPath, ownerID, repoName)
}

// CreateRepositoryHooks sets up the necessary Git hooks for a repository
func CreateRepositoryHooks(repoPath string) error {
	// Create a post-receive hook to update the working directory
	hooksDir := filepath.Join(repoPath, "hooks")
	if err := os.MkdirAll(hooksDir, 0755); err != nil {
		return fmt.Errorf("failed to create hooks directory: %w", err)
	}

	// Create post-receive hook
	hookPath := filepath.Join(hooksDir, "post-receive")
	hookContent := `#!/bin/sh
# This hook is called after a successful push
echo "Repository updated successfully!"
`
	if err := os.WriteFile(hookPath, []byte(hookContent), 0755); err != nil {
		return fmt.Errorf("failed to create post-receive hook: %w", err)
	}

	return nil
}

// DeleteGitRepository removes a Git repository from the filesystem
func DeleteGitRepository(repoPath string) error {
	if err := os.RemoveAll(repoPath); err != nil {
		return fmt.Errorf("failed to delete repository: %w", err)
	}
	return nil
}
