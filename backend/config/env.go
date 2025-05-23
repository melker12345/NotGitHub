package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

// load the.env file
func LoadEnv() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
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
