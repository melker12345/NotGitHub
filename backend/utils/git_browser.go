package utils

import (
	"bytes"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"
)

// FileEntry represents a file or directory in the repository
type FileEntry struct {
	Name        string       `json:"name"`
	Path        string       `json:"path"`
	Type        string       `json:"type"` // "file", "dir", or "symlink"
	Size        int64        `json:"size,omitempty"`
	Mode        string       `json:"mode,omitempty"`
	SHA         string       `json:"sha,omitempty"`
	URL         string       `json:"url,omitempty"`
	Content     string       `json:"content,omitempty"`
	Encoding    string       `json:"encoding,omitempty"`
	SubEntries  []*FileEntry `json:"entries,omitempty"`
	LastCommit  *Commit      `json:"last_commit,omitempty"`
	ContentType string       `json:"content_type,omitempty"`
}

// Commit represents a Git commit
type Commit struct {
	SHA       string    `json:"sha"`
	Author    string    `json:"author"`
	Email     string    `json:"email"`
	Message   string    `json:"message"`
	Timestamp time.Time `json:"timestamp"`
	// For parsing the timestamp from git output
	TimestampStr string `json:"-"`
}

// GetRepositoryContents retrieves files and directories at the specified path
func GetRepositoryContents(repoPath, relativePath, ref string) ([]*FileEntry, error) {
	if ref == "" {
		ref = "HEAD" // Default to HEAD if no ref is provided
	}

	// Handle root directory
	if relativePath == "" || relativePath == "/" {
		relativePath = "."
	}

	// Check if the repository exists
	if _, err := os.Stat(repoPath); os.IsNotExist(err) {
		return nil, fmt.Errorf("repository does not exist")
	}

	// List files in the directory using git ls-tree
	cmd := exec.Command("git", "-C", repoPath, "ls-tree", "-l", ref, relativePath)
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr
	err := cmd.Run()
	if err != nil {
		return nil, fmt.Errorf("error listing files: %v - %s", err, stderr.String())
	}

	// Parse the output
	entries := make([]*FileEntry, 0)
	lines := strings.Split(stdout.String(), "\n")
	for _, line := range lines {
		if line == "" {
			continue
		}

		// Parse git ls-tree output
		// Format: <mode> <type> <object> <size> <path>
		parts := strings.Fields(line)
		if len(parts) < 5 {
			continue
		}

		mode := parts[0]
		entryType := parts[1]
		sha := parts[2]
		size := parts[3]
		name := strings.Join(parts[4:], " ")
		path := filepath.Join(relativePath, name)
		
		// Determine entry type
		var entryTypeStr string
		if entryType == "blob" {
			entryTypeStr = "file"
		} else if entryType == "tree" {
			entryTypeStr = "dir"
		} else if entryType == "commit" {
			entryTypeStr = "submodule"
		} else {
			entryTypeStr = "unknown"
		}

		// Get last commit for this file
		lastCommit, _ := GetLastCommitForFile(repoPath, path, ref)

		sizeInt := int64(0)
		fmt.Sscanf(size, "%d", &sizeInt)

		entry := &FileEntry{
			Name:       name,
			Path:       path,
			Type:       entryTypeStr,
			Size:       sizeInt,
			Mode:       mode,
			SHA:        sha,
			LastCommit: lastCommit,
		}

		entries = append(entries, entry)
	}

	return entries, nil
}

// GetFileContent retrieves the content of a file
func GetFileContent(repoPath, filePath, ref string) (*FileEntry, error) {
	if ref == "" {
		ref = "HEAD"
	}

	// Check if the repository exists
	if _, err := os.Stat(repoPath); os.IsNotExist(err) {
		return nil, fmt.Errorf("repository does not exist")
	}

	// Get file metadata
	cmd := exec.Command("git", "-C", repoPath, "ls-tree", "-l", ref, filePath)
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr
	err := cmd.Run()
	if err != nil {
		return nil, fmt.Errorf("error getting file metadata: %v - %s", err, stderr.String())
	}

	// Parse metadata
	lines := strings.Split(stdout.String(), "\n")
	if len(lines) == 0 || lines[0] == "" {
		return nil, fmt.Errorf("file not found: %s", filePath)
	}

	parts := strings.Fields(lines[0])
	if len(parts) < 5 {
		return nil, fmt.Errorf("invalid ls-tree output format")
	}

	mode := parts[0]
	entryType := parts[1]
	sha := parts[2]
	size := parts[3]
	name := strings.Join(parts[4:], " ")

	if entryType != "blob" {
		return nil, fmt.Errorf("path is not a file")
	}

	// Get file content
	cmd = exec.Command("git", "-C", repoPath, "show", fmt.Sprintf("%s:%s", ref, filePath))
	stdout.Reset()
	stderr.Reset()
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr
	err = cmd.Run()
	if err != nil {
		return nil, fmt.Errorf("error getting file content: %v - %s", err, stderr.String())
	}

	// Get last commit for this file
	lastCommit, _ := GetLastCommitForFile(repoPath, filePath, ref)

	// Determine content type (simple detection based on file extension)
	fileExt := strings.ToLower(filepath.Ext(name))
	contentType := determineContentType(fileExt)

	sizeInt := int64(0)
	fmt.Sscanf(size, "%d", &sizeInt)

	return &FileEntry{
		Name:        name,
		Path:        filePath,
		Type:        "file",
		Size:        sizeInt,
		Mode:        mode,
		SHA:         sha,
		Content:     stdout.String(),
		Encoding:    "utf-8", // We're assuming UTF-8 encoding
		LastCommit:  lastCommit,
		ContentType: contentType,
	}, nil
}

// GetCommitHistory retrieves the commit history for a repository
func GetCommitHistory(repoPath, ref string, limit int) ([]*Commit, error) {
	if ref == "" {
		ref = "HEAD"
	}

	if limit <= 0 {
		limit = 10 // Default to 10 commits
	}

	// Check if the repository exists
	if _, err := os.Stat(repoPath); os.IsNotExist(err) {
		return nil, fmt.Errorf("repository does not exist")
	}

	// Get commit history
	cmd := exec.Command(
		"git", "-C", repoPath, "log", 
		"--pretty=format:{\"sha\":\"%H\",\"author\":\"%an\",\"email\":\"%ae\",\"message\":\"%s\",\"timestampStr\":\"%ci\"}", 
		"--max-count", fmt.Sprintf("%d", limit),
		ref,
	)
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr
	err := cmd.Run()
	if err != nil {
		return nil, fmt.Errorf("error getting commit history: %v - %s", err, stderr.String())
	}

	// Parse the JSON lines
	lines := strings.Split(stdout.String(), "\n")
	commits := make([]*Commit, 0, len(lines))

	for _, line := range lines {
		if line == "" {
			continue
		}

		var commit Commit
		if err := json.Unmarshal([]byte(line), &commit); err != nil {
			return nil, fmt.Errorf("error parsing commit: %v", err)
		}

		// Parse the timestamp
		timestamp, err := time.Parse("2006-01-02 15:04:05 -0700", commit.TimestampStr)
		if err == nil {
			commit.Timestamp = timestamp
		}

		commits = append(commits, &commit)
	}

	return commits, nil
}

// GetLastCommitForFile gets the last commit that modified a specific file
func GetLastCommitForFile(repoPath, filePath, ref string) (*Commit, error) {
	if ref == "" {
		ref = "HEAD"
	}

	// Get the last commit for this file
	cmd := exec.Command(
		"git", "-C", repoPath, "log", 
		"--pretty=format:{\"sha\":\"%H\",\"author\":\"%an\",\"email\":\"%ae\",\"message\":\"%s\",\"timestampStr\":\"%ci\"}", 
		"-n", "1",
		ref,
		"--",
		filePath,
	)
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr
	err := cmd.Run()
	if err != nil {
		return nil, fmt.Errorf("error getting last commit: %v - %s", err, stderr.String())
	}

	output := strings.TrimSpace(stdout.String())
	if output == "" {
		return nil, nil
	}

	var commit Commit
	if err := json.Unmarshal([]byte(output), &commit); err != nil {
		return nil, fmt.Errorf("error parsing commit: %v", err)
	}

	// Parse the timestamp
	timestamp, err := time.Parse("2006-01-02 15:04:05 -0700", commit.TimestampStr)
	if err == nil {
		commit.Timestamp = timestamp
	}

	return &commit, nil
}

// determineContentType returns a content type based on file extension
func determineContentType(fileExt string) string {
	switch fileExt {
	case ".go":
		return "text/x-go"
	case ".js", ".jsx":
		return "text/javascript"
	case ".ts", ".tsx":
		return "text/typescript"
	case ".html":
		return "text/html"
	case ".css":
		return "text/css"
	case ".md":
		return "text/markdown"
	case ".json":
		return "application/json"
	case ".yaml", ".yml":
		return "text/yaml"
	case ".xml":
		return "text/xml"
	case ".sql":
		return "text/x-sql"
	case ".sh":
		return "text/x-sh"
	case ".py":
		return "text/x-python"
	case ".rb":
		return "text/x-ruby"
	case ".java":
		return "text/x-java"
	case ".c", ".cpp", ".h", ".hpp":
		return "text/x-c++src"
	case ".php":
		return "text/x-php"
	case ".rs":
		return "text/x-rust"
	case ".txt":
		return "text/plain"
	default:
		return "text/plain"
	}
}
