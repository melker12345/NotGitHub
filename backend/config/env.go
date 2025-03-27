package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

// LoadEnv loads the environment variables from .env file
func LoadEnv() {
	// Try to load .env file, but don't fail if it doesn't exist (in production it might be set differently)
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Check for required environment variables
	requiredEnvVars := []string{
		"DB_HOST", "DB_PORT", "DB_USER", "DB_PASSWORD", "DB_NAME",
		"JWT_SECRET",
	}

	for _, envVar := range requiredEnvVars {
		if os.Getenv(envVar) == "" {
			log.Printf("Warning: Required environment variable %s is not set", envVar)
		}
	}
}
