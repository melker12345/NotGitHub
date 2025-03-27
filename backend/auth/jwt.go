package auth

import (
	"errors"
	"os"
	"strconv"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// JWT-related errors
var (
	ErrInvalidToken = errors.New("invalid or expired token")
)

// Claims represents the JWT claims
type Claims struct {
	UserID string `json:"user_id"`
	jwt.RegisteredClaims
}

// GenerateToken creates a new JWT token for a user
func GenerateToken(userID string) (string, error) {
	// Get JWT secret from environment variable
	jwtSecret := []byte(os.Getenv("JWT_SECRET"))
	
	// Get token expiration from environment variable
	expirationHours := 24 // Default to 24 hours
	if envExpiration := os.Getenv("JWT_EXPIRATION_HOURS"); envExpiration != "" {
		if exp, err := strconv.Atoi(envExpiration); err == nil {
			expirationHours = exp
		}
	}

	// Set expiration time for the token
	expirationTime := time.Now().Add(time.Duration(expirationHours) * time.Hour)

	// Create claims with user ID and expiration time
	claims := &Claims{
		UserID: userID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	// Create the token with claims and sign it
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(jwtSecret)

	return tokenString, err
}

// ValidateToken validates and parses a JWT token
func ValidateToken(tokenString string) (*Claims, error) {
	// Get JWT secret from environment variable
	jwtSecret := []byte(os.Getenv("JWT_SECRET"))
	
	// Parse the token
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		return jwtSecret, nil
	})

	if err != nil {
		return nil, err
	}

	if !token.Valid {
		return nil, ErrInvalidToken
	}

	return claims, nil
}
