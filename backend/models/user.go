package models

import (
	"database/sql"
	"time"

	"github-clone/config"
	
	"github.com/google/uuid"
)

// User represents a user in the system
type User struct {
	ID        string    `json:"id"`
	Username  string    `json:"username"`
	Email     string    `json:"email"`
	Password  string    `json:"-"` // Password is not sent in JSON responses
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// UserResponse is the user data returned to clients (excludes sensitive data)
type UserResponse struct {
	ID        string    `json:"id"`
	Username  string    `json:"username"`
	Email     string    `json:"email"`
	CreatedAt time.Time `json:"created_at"`
}

// ToResponse converts a User to a UserResponse
func (u *User) ToResponse() UserResponse {
	return UserResponse{
		ID:        u.ID,
		Username:  u.Username,
		Email:     u.Email,
		CreatedAt: u.CreatedAt,
	}
}

// CreateUser inserts a new user into the database
func CreateUser(username, email, password string) (*User, error) {
	// Generate a unique ID using UUID
	id := uuid.New().String()
	now := time.Now()
	
	// Create the user struct
	user := &User{
		ID:        id,
		Username:  username,
		Email:     email,
		Password:  password, // Note: This should be pre-hashed
		CreatedAt: now,
		UpdatedAt: now,
	}
	
	// Insert the user into the database
	_, err := config.DB.Exec(
		"INSERT INTO users (id, username, email, password, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6)",
		user.ID, user.Username, user.Email, user.Password, user.CreatedAt, user.UpdatedAt,
	)
	
	if err != nil {
		return nil, err
	}
	
	return user, nil
}

// GetUserByEmail retrieves a user by email
func GetUserByEmail(email string) (*User, error) {
	var user User
	
	err := config.DB.QueryRow(
		"SELECT id, username, email, password, created_at, updated_at FROM users WHERE email = $1",
		email,
	).Scan(&user.ID, &user.Username, &user.Email, &user.Password, &user.CreatedAt, &user.UpdatedAt)
	
	if err == sql.ErrNoRows {
		return nil, nil
	}
	
	if err != nil {
		return nil, err
	}
	
	return &user, nil
}

// GetUserByUsername retrieves a user by username
func GetUserByUsername(username string) (*User, error) {
	var user User
	
	err := config.DB.QueryRow(
		"SELECT id, username, email, password, created_at, updated_at FROM users WHERE username = $1",
		username,
	).Scan(&user.ID, &user.Username, &user.Email, &user.Password, &user.CreatedAt, &user.UpdatedAt)
	
	if err == sql.ErrNoRows {
		return nil, nil
	}
	
	if err != nil {
		return nil, err
	}
	
	return &user, nil
}

// GetUserByID retrieves a user by ID
func GetUserByID(id string) (*User, error) {
	var user User
	
	err := config.DB.QueryRow(
		"SELECT id, username, email, password, created_at, updated_at FROM users WHERE id = $1",
		id,
	).Scan(&user.ID, &user.Username, &user.Email, &user.Password, &user.CreatedAt, &user.UpdatedAt)
	
	if err == sql.ErrNoRows {
		return nil, nil
	}
	
	if err != nil {
		return nil, err
	}
	
	return &user, nil
}
