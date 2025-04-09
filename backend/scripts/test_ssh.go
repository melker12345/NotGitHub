package main

import (
	"fmt"
	"log"
	"os"
	"path/filepath"

	"github-clone/config"
	"github-clone/models"
)

func main() {
	// Load environment variables
	config.LoadEnv()

	// Connect to the database
	if err := config.ConnectDB(); err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Close database connection when application exits
	defer config.DB.Close()

	// Print SSH server details
	sshPort := os.Getenv("SSH_PORT")
	if sshPort == "" {
		sshPort = "2222" // Default SSH port
	}
	
	hostKeyPath := os.Getenv("SSH_HOST_KEY_PATH")
	if hostKeyPath == "" {
		// Default to a file in the current directory
		dir, _ := os.Getwd()
		hostKeyPath = filepath.Join(dir, "ssh_host_key")
	}
	
	fmt.Printf("SSH Server Configuration:\n")
	fmt.Printf("  Port: %s\n", sshPort)
	fmt.Printf("  Host Key Path: %s\n", hostKeyPath)
	
	// Check if host key exists
	_, err := os.Stat(hostKeyPath)
	if os.IsNotExist(err) {
		fmt.Printf("  Host Key Status: NOT FOUND\n")
	} else if err != nil {
		fmt.Printf("  Host Key Status: ERROR - %v\n", err)
	} else {
		fmt.Printf("  Host Key Status: EXISTS\n")
	}
	
	// Print all registered SSH keys
	keys, err := models.GetAllSSHKeys()
	if err != nil {
		log.Fatalf("Failed to retrieve SSH keys: %v", err)
	}
	
	fmt.Printf("\nRegistered SSH Keys (%d keys found):\n", len(keys))
	
	if len(keys) == 0 {
		fmt.Println("  No SSH keys registered in the database.")
		fmt.Println("\nPlease register an SSH key through the web interface to use Git over SSH.")
	} else {
		for i, key := range keys {
			user, err := models.GetUserByID(key.UserID)
			username := "Unknown"
			if err == nil && user != nil {
				username = user.Username
			}
			
			fmt.Printf("  Key #%d:\n", i+1)
			fmt.Printf("    ID: %s\n", key.ID)
			fmt.Printf("    Name: %s\n", key.Name)
			fmt.Printf("    User: %s (ID: %s)\n", username, key.UserID)
			fmt.Printf("    Fingerprint: %s\n", key.Fingerprint)
			fmt.Printf("    Added: %s\n", key.CreatedAt.Format("2006-01-02 15:04:05"))
			fmt.Println()
		}
	}
	
	fmt.Println("\nGit SSH Connection Instructions:")
	fmt.Println("1. Make sure your SSH key is added to the application through the web interface")
	fmt.Println("2. Use the following Git remote format:")
	fmt.Println("   git remote add origin ssh://git@localhost:2222/username/repository.git")
	fmt.Println("3. When pushing, specify the branch name:")
	fmt.Println("   git push -u origin master")
	fmt.Println("\nFor debugging, you can test the SSH connection with:")
	fmt.Println("   ssh -vT git@localhost -p 2222")
}
