package ssh

import (
	"encoding/base64"
	"fmt"
	"io"
	"log"
	"net"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github-clone/models"
	"github-clone/utils"

	"golang.org/x/crypto/ssh"
)

// Server represents the SSH server
type Server struct {
	config     *ssh.ServerConfig
	listenAddr string
	hostKeys   []ssh.Signer
}

// NewServer creates a new SSH server
func NewServer(listenAddr string, hostKeyPath string) (*Server, error) {
	server := &Server{
		listenAddr: listenAddr,
	}

	// Set up server config
	server.config = &ssh.ServerConfig{
		PublicKeyCallback: server.authPublicKey,
	}

	// Load or generate host key
	if _, err := os.Stat(hostKeyPath); os.IsNotExist(err) {
		log.Printf("Host key not found, generating new key at %s", hostKeyPath)
		err = generateHostKey(hostKeyPath)
		if err != nil {
			return nil, fmt.Errorf("failed to generate host key: %w", err)
		}
	}

	// Load the host key
	hostKey, err := loadHostKey(hostKeyPath)
	if err != nil {
		return nil, err
	}
	server.hostKeys = []ssh.Signer{hostKey}
	server.config.AddHostKey(hostKey)

	return server, nil
}

// Start begins listening for SSH connections
func (s *Server) Start() error {
	listener, err := net.Listen("tcp", s.listenAddr)
	if err != nil {
		return fmt.Errorf("failed to listen on %s: %w", s.listenAddr, err)
	}

	log.Printf("SSH server listening on %s", s.listenAddr)

	for {
		conn, err := listener.Accept()
		if err != nil {
			log.Printf("Failed to accept connection: %v", err)
			continue
		}

		go s.handleConnection(conn)
	}
}

// handleConnection processes a single SSH connection
func (s *Server) handleConnection(conn net.Conn) {
	defer conn.Close()

	// Perform SSH handshake
	sshConn, chans, reqs, err := ssh.NewServerConn(conn, s.config)
	if err != nil {
		log.Printf("Failed to handshake: %v", err)
		return
	}

	log.Printf("SSH connection from %s (%s)", sshConn.RemoteAddr(), sshConn.ClientVersion())
	defer log.Printf("SSH connection closed from %s", sshConn.RemoteAddr())

	// Discard all global requests
	go ssh.DiscardRequests(reqs)

	// Handle channels
	for newChannel := range chans {
		if newChannel.ChannelType() != "session" {
			newChannel.Reject(ssh.UnknownChannelType, "unknown channel type")
			continue
		}

		channel, requests, err := newChannel.Accept()
		if err != nil {
			log.Printf("Failed to accept channel: %v", err)
			continue
		}

		// Handle requests on this channel
		go s.handleChannelRequests(channel, requests, sshConn.Permissions.Extensions["username"])
	}
}

// handleChannelRequests processes requests on an SSH channel
func (s *Server) handleChannelRequests(channel ssh.Channel, requests <-chan *ssh.Request, username string) {
	defer channel.Close()

	for req := range requests {
		switch req.Type {
		case "exec":
			// Handle Git commands (git-upload-pack, git-receive-pack)
			s.handleExecRequest(channel, req, username)

		case "env":
			// Environment variables - just acknowledge them
			req.Reply(true, nil)

		default:
			log.Printf("Unsupported request type: %s", req.Type)
			req.Reply(false, nil)
		}
	}
}

// handleExecRequest processes an exec request (Git command)
func (s *Server) handleExecRequest(channel ssh.Channel, req *ssh.Request, username string) {
	// Parse the command from the request payload
	command := string(req.Payload[4:]) // Skip the uint32 length prefix
	log.Printf("Received exec request: %s", command)

	// Acknowledge the request
	req.Reply(true, nil)

	// Determine the Git operation and repository path
	if strings.HasPrefix(command, "git-upload-pack") || strings.HasPrefix(command, "git-receive-pack") {
		s.handleGitCommand(channel, command, username)
	} else {
		fmt.Fprintf(channel, "Unsupported command: %s\n", command)
		channel.CloseWrite()
		return
	}
}

// handleGitCommand executes a Git command (upload-pack or receive-pack)
func (s *Server) handleGitCommand(channel ssh.Channel, command string, username string) {
	defer channel.CloseWrite()

	// Parse repository path from command
	// Format: git-upload-pack '/owner/repo.git' or git-receive-pack '/owner/repo.git'
	parts := strings.Split(command, " ")
	if len(parts) < 2 {
		fmt.Fprintf(channel, "Invalid command format\n")
		return
	}

	gitOp := parts[0]
	repoArg := strings.Trim(parts[1], "'\"")
	repoPath := strings.TrimPrefix(repoArg, "/")
	repoPath = strings.TrimSuffix(repoPath, ".git")
	
	// Split owner and repository name
	pathParts := strings.Split(repoPath, "/")
	if len(pathParts) < 2 {
		fmt.Fprintf(channel, "Invalid repository path format\n")
		return
	}
	
	ownerName := pathParts[0]
	repoName := pathParts[1]
	
	// Get the owner of the repository
	owner, err := models.GetUserByUsername(ownerName)
	if err != nil {
		log.Printf("Error fetching repository owner: %v", err)
		fmt.Fprintf(channel, "Error accessing repository\n")
		return
	}
	
	if owner == nil {
		fmt.Fprintf(channel, "Repository not found\n")
		return
	}
	
	// Get the repository
	repo, err := models.GetRepositoryByOwnerAndName(owner.ID, repoName)
	if err != nil {
		log.Printf("Error fetching repository: %v", err)
		fmt.Fprintf(channel, "Error accessing repository\n")
		return
	}
	
	if repo == nil {
		fmt.Fprintf(channel, "Repository not found\n")
		return
	}
	
	// Check repository access permissions
	if username != owner.Username {
		// Check if this user is a collaborator
		// For now, only owners can access
		fmt.Fprintf(channel, "Access denied to repository\n")
		return
	}
	
	// Get the filesystem path for the repository
	repoFilesystemPath := utils.GetRepositoryPath(owner.ID, repoName)
	
	// Execute the Git command
	cmd := exec.Command(gitOp, repoFilesystemPath)
	cmd.Env = os.Environ()
	
	stdin, err := cmd.StdinPipe()
	if err != nil {
		log.Printf("Error creating stdin pipe: %v", err)
		fmt.Fprintf(channel, "Internal error\n")
		return
	}
	
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		log.Printf("Error creating stdout pipe: %v", err)
		fmt.Fprintf(channel, "Internal error\n")
		return
	}
	
	stderr, err := cmd.StderrPipe()
	if err != nil {
		log.Printf("Error creating stderr pipe: %v", err)
		fmt.Fprintf(channel, "Internal error\n")
		return
	}
	
	// Start the command
	if err := cmd.Start(); err != nil {
		log.Printf("Error starting Git command: %v", err)
		fmt.Fprintf(channel, "Internal error\n")
		return
	}
	
	// Connect pipes
	go func() {
		io.Copy(stdin, channel)
		stdin.Close()
	}()
	
	go io.Copy(channel, stdout)
	go io.Copy(channel.Stderr(), stderr)
	
	// Wait for the command to complete
	if err := cmd.Wait(); err != nil {
		log.Printf("Git command error: %v", err)
	}
}

// authPublicKey authenticates a user by their public SSH key
func (s *Server) authPublicKey(conn ssh.ConnMetadata, key ssh.PublicKey) (*ssh.Permissions, error) {
	// Generate fingerprint for the key
	fingerprint := ssh.FingerprintSHA256(key)
	
	// Find the user with this SSH key
	user, err := models.GetUserBySSHKey(fingerprint)
	if err != nil {
		log.Printf("Error looking up SSH key: %v", err)
		return nil, fmt.Errorf("server error")
	}
	
	if user == nil {
		log.Printf("Unknown SSH key: %s", fingerprint)
		return nil, fmt.Errorf("unknown key")
	}
	
	log.Printf("Authenticated user %s (ID: %s) with key %s", user.Username, user.ID, fingerprint)
	
	// Return permissions with username for later use
	return &ssh.Permissions{
		Extensions: map[string]string{
			"username": user.Username,
			"user_id":  user.ID,
		},
	}, nil
}

// loadHostKey loads an SSH host key from a file
func loadHostKey(path string) (ssh.Signer, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("failed to read host key: %w", err)
	}
	
	key, err := ssh.ParsePrivateKey(data)
	if err != nil {
		return nil, fmt.Errorf("failed to parse host key: %w", err)
	}
	
	return key, nil
}

// generateHostKey creates a new SSH host key
func generateHostKey(path string) error {
	// Ensure the directory exists
	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0700); err != nil {
		return fmt.Errorf("failed to create host key directory: %w", err)
	}
	
	// Generate the key using ssh-keygen
	cmd := exec.Command("ssh-keygen", "-t", "rsa", "-f", path, "-N", "")
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("failed to generate host key: %w\nOutput: %s", err, string(output))
	}
	
	// Set restrictive permissions
	if err := os.Chmod(path, 0600); err != nil {
		return fmt.Errorf("failed to set host key permissions: %w", err)
	}
	
	return nil
}

// ParsePublicKey parses an SSH public key and returns its fingerprint
func ParsePublicKey(keyData string) (string, error) {
	// Clean the key data (remove comments, extra spaces)
	keyData = strings.TrimSpace(keyData)
	parts := strings.Split(keyData, " ")
	
	if len(parts) < 2 {
		return "", fmt.Errorf("invalid SSH public key format")
	}
	
	// Decode the key
	keyBytes, err := base64.StdEncoding.DecodeString(parts[1])
	if err != nil {
		return "", fmt.Errorf("failed to decode public key: %w", err)
	}
	
	// Parse the key
	pubKey, err := ssh.ParsePublicKey(keyBytes)
	if err != nil {
		return "", fmt.Errorf("failed to parse public key: %w", err)
	}
	
	// Generate fingerprint
	fingerprint := ssh.FingerprintSHA256(pubKey)
	return fingerprint, nil
}
