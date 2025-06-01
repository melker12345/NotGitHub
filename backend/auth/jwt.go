package auth

import (
	"errors"
	"os"
	"strconv"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// JWT errors
var (
	ErrInvalidToken = errors.New("invalid or expired token")
)

// JWT claims
type Claims struct {
	UserID string `json:"user_id"`
	jwt.RegisteredClaims
}

// Create JWT token 
func GenerateToken(userID string) (string, error) {
	jwtSecret := []byte(os.Getenv("JWT_SECRET"))
	
	// Default expiration time 24 hours
	expirationHours := 24 
	if envExpiration := os.Getenv("JWT_EXPIRATION_HOURS"); envExpiration != "" {
		if exp, err := strconv.Atoi(envExpiration); err == nil {
			expirationHours = exp
		}
	}

	expirationTime := time.Now().Add(time.Duration(expirationHours) * time.Hour)

	claims := &Claims{
		UserID: userID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(jwtSecret)

	return tokenString, err
}

// Create long-lived JWT token for API/Git access
func GenerateLongLivedToken(userID string, expirationInYears int) (string, error) {
	jwtSecret := []byte(os.Getenv("JWT_SECRET"))

	if expirationInYears <= 0 { 
		expirationInYears = 100 

	// Calculate expiration time in years
	expirationTime := time.Now().AddDate(expirationInYears, 0, 0) // Adds years, months, days

	claims := &Claims{
		UserID: userID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),

		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(jwtSecret)

	return tokenString, err
}

// validates a JWT token
func ValidateToken(tokenString string) (*Claims, error) {
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
