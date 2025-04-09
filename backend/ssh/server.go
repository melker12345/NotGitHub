package ssh

import (
	"fmt"
	"io"
	"log"
	"net"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github-clone/models"

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
		// Only allow public key authentication
		PublicKeyCallback: server.authPublicKey,
		
		// Disable other authentication methods
		PasswordCallback:           nil,
		KeyboardInteractiveCallback: nil,
		
		// Set banner message
		BannerCallback: func(conn ssh.ConnMetadata) string {
			log.Printf("SSH connection from %s@%s", conn.User(), conn.RemoteAddr())
			return "GitHub Clone - SSH server\n"
		},
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

	// Set a timeout for the handshake
	timeoutConn := conn
	timeoutConn.SetDeadline(time.Now().Add(30 * time.Second))

	// Perform SSH handshake
	sshConn, chans, reqs, err := ssh.NewServerConn(timeoutConn, s.config)
	if err != nil {
		log.Printf("Failed to handshake: %v", err)
		return
	}

	// Reset the timeout after successful handshake
	timeoutConn.SetDeadline(time.Time{})

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

		// Get username from connection
		username := sshConn.Permissions.Extensions["username"]

		// Handle channel requests (exec, shell, etc.)
		go s.handleChannelRequests(channel, requests, username)
	}
}

// handleChannelRequests processes requests on an SSH channel
func (s *Server) handleChannelRequests(channel ssh.Channel, requests <-chan *ssh.Request, username string) {
	defer channel.Close()

	for req := range requests {
		switch req.Type {
		case "exec":
			// Handle exec request (Git command)
			s.handleExecRequest(channel, req, username)
			return
		default:
			if req.WantReply {
				req.Reply(false, nil)
			}
		}
	}
}

// handleExecRequest processes an exec request (Git command)
func (s *Server) handleExecRequest(channel ssh.Channel, req *ssh.Request, username string) {
	// Acknowledge the request
	if req.WantReply {
		req.Reply(true, nil)
	}

	// Parse the command
	command := string(req.Payload[4:]) // Skip the 4-byte length prefix
	log.Printf("Exec request from %s: %s", username, command)

	// Handle Git commands
	if strings.HasPrefix(command, "git-") || strings.HasPrefix(command, "git ") {
		s.handleGitCommand(channel, command, username)
	} else {
		fmt.Fprintf(channel.Stderr(), "Unsupported command: %s\n", command)
		channel.SendRequest("exit-status", false, []byte{0, 0, 0, 1})
	}
}

// handleGitCommand executes a Git command (upload-pack or receive-pack)
func (s *Server) handleGitCommand(channel ssh.Channel, command string, username string) {
	log.Printf("Git command from %s: %s", username, command)

	// Parse the command to extract the repository path
	var repoPath string
	var gitCommand string

	if strings.HasPrefix(command, "git-upload-pack") {
		parts := strings.SplitN(command, "'", 3)
		if len(parts) >= 2 {
			repoPath = strings.Trim(parts[1], "'")
			gitCommand = "git-upload-pack"
		}
	} else if strings.HasPrefix(command, "git-receive-pack") {
		parts := strings.SplitN(command, "'", 3)
		if len(parts) >= 2 {
			repoPath = strings.Trim(parts[1], "'")
			gitCommand = "git-receive-pack"
		}
	} else if strings.HasPrefix(command, "git ") {
		// Handle 'git' commands
		parts := strings.Fields(command)
		if len(parts) >= 3 {
			gitCommand = parts[1]
			repoPath = parts[2]
		}
	}

	if repoPath == "" || gitCommand == "" {
		fmt.Fprintf(channel.Stderr(), "Invalid Git command format\n")
		channel.SendRequest("exit-status", false, []byte{0, 0, 0, 1})
		return
	}

	// Clean up the repository path
	repoPath = strings.TrimPrefix(repoPath, "/")

	// Map the repository path to the actual filesystem path
	// Format: username/reponame
	parts := strings.SplitN(repoPath, "/", 2)
	if len(parts) != 2 {
		fmt.Fprintf(channel.Stderr(), "Invalid repository path: %s\n", repoPath)
		channel.SendRequest("exit-status", false, []byte{0, 0, 0, 1})
		return
	}

	repoOwner := parts[0]
	repoName := parts[1]

	// Get the base repository path
	baseRepoPath := os.Getenv("REPOSITORIES_PATH")
	if baseRepoPath == "" {
		// Default to a subdirectory in the current working directory
		dir, _ := os.Getwd()
		baseRepoPath = filepath.Join(dir, "repositories")
	}

	log.Printf("Looking for repository: %s/%s", repoOwner, repoName)
	
	// Format Git repository path - username/repo.git
	gitRepoName := repoName
	if !strings.HasSuffix(gitRepoName, ".git") {
		gitRepoName += ".git"
	}
	
	// Construct the full filesystem path to the repository
	fsRepoPath := filepath.Join(baseRepoPath, repoOwner, gitRepoName)
	
	// Check if the repository exists
	if _, err := os.Stat(fsRepoPath); os.IsNotExist(err) {
		// Repository doesn't exist
		fmt.Fprintf(channel.Stderr(), "Repository not found: %s/%s\n", repoOwner, repoName)
		channel.SendRequest("exit-status", false, []byte{0, 0, 0, 1})
		return
	}
	
	log.Printf("Found repository at: %s", fsRepoPath)

	// Execute the Git command
	log.Printf("Executing %s on %s", gitCommand, fsRepoPath)

	// Create the command
	cmd := exec.Command(gitCommand, fsRepoPath)

	// Set up pipes for stdin, stdout, stderr
	stdin, _ := cmd.StdinPipe()
	stdout, _ := cmd.StdoutPipe()
	stderr, _ := cmd.StderrPipe()

	// Start the command
	if err := cmd.Start(); err != nil {
		log.Printf("Failed to start Git command: %v", err)
		fmt.Fprintf(channel.Stderr(), "Failed to execute Git command: %v\n", err)
		channel.SendRequest("exit-status", false, []byte{0, 0, 0, 1})
		return
	}

	// Copy data between SSH channel and command pipes
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
	keyType := key.Type()
	log.Printf("SSH AUTH: Key offered - User=%s, Type=%s, Fingerprint=%s",
		conn.User(), keyType, fingerprint)

	// Match keys by directly comparing fingerprints
	keys, err := models.GetAllSSHKeys()
	if err != nil {
		log.Printf("SSH AUTH ERROR: Database query failed: %v", err)
		return nil, fmt.Errorf("server error")
	}

	log.Printf("SSH AUTH: Checking %d keys in database", len(keys))
	
	// If no keys in database, fail early
	if len(keys) == 0 {
		log.Printf("SSH AUTH FAILED: No keys in database. Add a key through the web interface.")
		return nil, fmt.Errorf("no keys in database")
	}

	// Try direct matching with each key
	for _, k := range keys {
		log.Printf("SSH AUTH: Checking key '%s' (ID: %s)", k.Name, k.ID)
		
		// Parse the stored public key
		parsedKey, _, _, _, err := ssh.ParseAuthorizedKey([]byte(k.PublicKey))
		if err != nil {
			log.Printf("SSH AUTH: Failed to parse stored key: %v", err)
			continue
		}
		
		// Get the fingerprint in the same format as the client key
		storedFingerprint := ssh.FingerprintSHA256(parsedKey)
		log.Printf("SSH AUTH: Comparing - Stored=%s vs Client=%s", storedFingerprint, fingerprint)
		
		// If fingerprints match, authentication succeeds
		if storedFingerprint == fingerprint {
			// Get the user associated with this key
			user, err := models.GetUserByID(k.UserID)
			if err != nil || user == nil {
				log.Printf("SSH AUTH ERROR: Key matched but user lookup failed: %v", err)
				return nil, fmt.Errorf("server error")
			}
			
			log.Printf("SSH AUTH SUCCESS: User %s authenticated with key '%s'", user.Username, k.Name)
			
			// Return permissions with username for later use
			return &ssh.Permissions{
				Extensions: map[string]string{
					"username": user.Username,
					"user_id":  user.ID,
				},
			}, nil
		}
	}

	// If we get here, no matching key was found
	log.Printf("SSH AUTH FAILED: No matching key found for %s", fingerprint)
	return nil, fmt.Errorf("unknown key")
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
	// Create the directory if it doesn't exist
	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0700); err != nil {
		return fmt.Errorf("failed to create host key directory: %w", err)
	}

	// Generate the key using ssh-keygen
	cmd := exec.Command("ssh-keygen", "-t", "rsa", "-f", path, "-N", "")
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("failed to generate host key: %w", err)
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

	// Use ssh.ParseAuthorizedKey which properly handles the standard format
	pubKey, _, _, _, err := ssh.ParseAuthorizedKey([]byte(keyData))
	if err != nil {
		log.Printf("Error parsing SSH key: %v", err)
		return "", fmt.Errorf("failed to parse public key: %w", err)
	}

	// Generate fingerprint using the same method as the authentication
	fingerprint := ssh.FingerprintSHA256(pubKey)
	log.Printf("Parsed public key with fingerprint: %s", fingerprint)
	log.Printf("Public key type: %s", pubKey.Type())
	return fingerprint, nil
}
