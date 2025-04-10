package utils

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
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

	// For root directory, use ls-tree with -r to list all files recursively
	var cmd *exec.Cmd
	if relativePath == "." {
		// Use --name-only to just get paths for the root directory to get top-level entries
		cmd = exec.Command("git", "-C", repoPath, "ls-tree", ref)
	} else {
		// Check if the path is a directory by using ls-tree to see its type
		checkDirCmd := exec.Command("git", "-C", repoPath, "ls-tree", ref, relativePath)
		var checkOut, checkErr bytes.Buffer
		checkDirCmd.Stdout = &checkOut
		checkDirCmd.Stderr = &checkErr
		checkDirCmd.Run() // Ignore error as we're just checking
		
		checkResult := checkOut.String()
		log.Printf("Checking if '%s' is a directory: %s", relativePath, checkResult)
		
		// Check if the path is a directory (tree)
		isDir := strings.Contains(checkResult, "tree")
		
		if isDir {
			// If it's a directory, we need to get its contents
			// Use the ref:path/ format to get contents INSIDE the directory
			log.Printf("'%s' is a directory, getting its contents", relativePath)
			cmd = exec.Command("git", "-C", repoPath, "ls-tree", ref, relativePath + "/")
		} else {
			// If it's not a directory (or not found), use regular ls-tree
			log.Printf("'%s' is not a directory, using standard ls-tree", relativePath)
			cmd = exec.Command("git", "-C", repoPath, "ls-tree", ref, relativePath)
		}
	}
	
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr
	err := cmd.Run()

	// If there's an error or empty output, try different approach for root dir
	if (err != nil || stdout.String() == "") && relativePath == "." {
		// Try direct ls-files approach for bare repos or repos with just files
		allFilesCmd := exec.Command("git", "-C", repoPath, "ls-files")
		allFilesCmd.Stdout = &stdout
		allFilesCmd.Stderr = &stderr
		err = allFilesCmd.Run()
		
		if err != nil || stdout.String() == "" {
			// Check if it's a valid but empty repo
			validCmd := exec.Command("git", "-C", repoPath, "rev-parse", "--is-inside-work-tree")
			if validCmd.Run() != nil {
				return nil, fmt.Errorf("error listing files: %v - %s", err, stderr.String())
			}
			return []*FileEntry{}, nil
		}
		
		// Create a mapping of directories
		entries := make([]*FileEntry, 0)
		dirMap := make(map[string]bool)
		
		// Process each file and extract top-level directories
		for _, line := range strings.Split(stdout.String(), "\n") {
			if line == "" {
				continue
			}
			
			// Split the path to get the top-level directory or file
			parts := strings.SplitN(line, "/", 2)
			topLevel := parts[0]
			
			if len(parts) > 1 {
				// This is a file in a directory, just track the directory
				dirMap[topLevel] = true
			} else {
				// This is a file in the root
				entries = append(entries, &FileEntry{
					Name: topLevel,
					Path: topLevel,
					Type: "file",
				})
			}
		}
		
		// Add all the directories we found
		for dir := range dirMap {
			entries = append(entries, &FileEntry{
				Name: dir,
				Path: dir,
				Type: "dir",
			})
		}
		
		return entries, nil
	} else if err != nil || stdout.String() == "" {
		// If not root directory and not found, return empty
		return []*FileEntry{}, nil
	}

	// Parse the output for ls-tree format
	entries := make([]*FileEntry, 0)
	lines := strings.Split(stdout.String(), "\n")

	for _, line := range lines {
		if line == "" {
			continue
		}

		// Format for ls-tree output: <mode> <type> <object> <TAB> <file>
		// First, split by tab to separate the metadata from filename
		parts := strings.SplitN(line, "\t", 2)
		var name string
		if len(parts) == 2 {
			// We have the tab format
			name = parts[1]
			parts = strings.Fields(parts[0]) // Now parse the metadata part
		} else {
			// Try regular space-separated format
			parts = strings.Fields(line)
			if len(parts) < 4 {
				continue
			}
			name = strings.Join(parts[3:], " ")
			parts = parts[:3] // Keep just the metadata
		}

		if len(parts) < 3 {
			continue
		}

		mode := parts[0]
		entryTypeStr := parts[1] // "blob" for file, "tree" for directory
		sha := parts[2]
		
		// Convert Git entry type to our type
		var entryType string
		if entryTypeStr == "blob" {
			entryType = "file"
		} else if entryTypeStr == "tree" {
			entryType = "dir"
		} else {
			// Skip unknown types
			continue
		}
		
		// For files, get the size
		size := int64(0)
		if entryType == "file" {
			sizeCmd := exec.Command("git", "-C", repoPath, "cat-file", "-s", sha)
			sizeOutput, err := sizeCmd.Output()
			if err == nil {
				fmt.Sscanf(string(sizeOutput), "%d", &size)
			}
		}

		// Get the file path to use for commit lookup and display
		filePath := name
		if relativePath != "." {
			// Critical fix: prevent duplicated paths like "src/src/file.js"
			// If the name already starts with the relativePath, don't prepend it again
			if !strings.HasPrefix(name, relativePath+"/") && !strings.HasPrefix(name, relativePath+"\\") {
				filePath = filepath.Join(relativePath, name)
				log.Printf("Created file path: %s by joining %s and %s", filePath, relativePath, name)
			} else {
				// The name already contains the path - don't duplicate it
				log.Printf("Path already contains directory: %s - using name directly", name)
				filePath = name
			}
		}

		// Get last commit for this file but skip on large repositories to improve performance
		var lastCommit *Commit
		// Only get the last commit for top-level directories or files
		if !strings.Contains(filePath, "/") || strings.Count(filePath, "/") == 1 {
			lastCommit, _ = GetLastCommitForFile(repoPath, filePath, ref)
		}

		// Determine content type for files
		var contentType string
		if entryType == "file" {
			fileExt := strings.ToLower(filepath.Ext(name))
			contentType = determineContentType(fileExt)
		}

		// Create the entry
		entry := &FileEntry{
			Name:        name,
			Path:        filePath,
			Type:        entryType,
			Size:        size, 
			Mode:        mode,
			SHA:         sha,
			LastCommit:  lastCommit,
			ContentType: contentType,
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
	
	// First, check if this path is a directory
	checkTypeCmd := exec.Command("git", "-C", repoPath, "ls-tree", ref, filePath)
	var typeOut, typeErr bytes.Buffer
	checkTypeCmd.Stdout = &typeOut
	checkTypeCmd.Stderr = &typeErr
	checkTypeCmd.Run() // Ignore error since we're just checking
	
	// Parse the output to check if it's a directory
	typeOutput := typeOut.String()
	if strings.Contains(typeOutput, "tree") || strings.Count(typeOutput, "\n") > 1 {
		// This indicates a directory, not a file
		return nil, fmt.Errorf("cannot get file content for a directory: %s", filePath)
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

	// Get file content using git show with proper path format
	// This is the critical part: using ref:path format for nested files
	// Always convert Windows-style backslashes to forward slashes for Git
	// Git always uses forward slashes regardless of OS
	
	// CRITICAL FIX: Convert all backslashes to forward slashes
	gitPath := strings.ReplaceAll(filePath, "\\", "/")
	
	// Fix duplicated paths like "src/src/file.js"
	pathParts := strings.Split(gitPath, "/")
	if len(pathParts) >= 2 && pathParts[0] == pathParts[1] {
		// Found a duplicated directory name, fix it
		log.Printf("Found duplicated directory in path: %s", gitPath)
		gitPath = strings.Join(pathParts[1:], "/")
		log.Printf("Fixed path: %s", gitPath)
	}
	
	// Build the Git command with proper path format
	fileCmdStr := fmt.Sprintf("%s:%s", ref, gitPath)
	cmd = exec.Command("git", "-C", repoPath, "show", fileCmdStr)
	stdout.Reset()
	stderr.Reset()
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	// Log the exact command for debugging
	log.Printf("Executing git command: git -C %s show %s", repoPath, fileCmdStr)
	
	err = cmd.Run()
	if err != nil {
		log.Printf("Error fetching file content: %v - %s", err, stderr.String())
		return nil, fmt.Errorf("error getting file content: %v - %s", err, stderr.String())
	}

	// Get last commit for this file
	lastCommit, _ := GetLastCommitForFile(repoPath, filePath, ref)

	// Determine content type (simple detection based on file extension)
	fileExt := strings.ToLower(filepath.Ext(name))
	contentType := determineContentType(fileExt)

	sizeInt := int64(0)
	fmt.Sscanf(size, "%d", &sizeInt)

	// Try to clean the content string for better display
	content := stdout.String()
	
	// Remove common BOM and control characters that might appear
	content = strings.ReplaceAll(content, "\uFEFF", "") // BOM
	content = strings.ReplaceAll(content, "\u0000", "") // Null byte

	return &FileEntry{
		Name:        name,
		Path:        filePath,
		Type:        "file",
		Size:        sizeInt,
		Mode:        mode,
		SHA:         sha,
		Content:     content,
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
