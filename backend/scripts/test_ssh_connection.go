package main

import (
	"fmt"
	"log"
	"os"
	"os/exec"
)

func main() {
	fmt.Println("Testing SSH connection to GitHub Clone server...")
	fmt.Println("This will help diagnose SSH authentication issues")
	fmt.Println("------------------------------------------------")
	
	// Check if SSH is available
	_, err := exec.LookPath("ssh")
	if err != nil {
		log.Fatalf("SSH client not found in PATH: %v", err)
	}
	
	// Try to connect with verbose output
	cmd := exec.Command("ssh", "-vT", "git@localhost", "-p", "2222")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	
	fmt.Println("\nAttempting to connect with verbose output...")
	fmt.Println("This may take a moment...\n")
	
	if err := cmd.Run(); err != nil {
		fmt.Printf("\nConnection test completed with error: %v\n", err)
		fmt.Println("\nCommon issues:")
		fmt.Println("1. SSH key not registered in the GitHub Clone application")
		fmt.Println("2. SSH server not running or listening on wrong port")
		fmt.Println("3. SSH key format not recognized")
		fmt.Println("\nPlease see the docs/ssh_configuration.md file for detailed setup instructions")
	} else {
		fmt.Println("\nSSH connection successful!")
	}
}
