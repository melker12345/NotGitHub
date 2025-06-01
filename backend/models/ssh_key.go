package models

import (
	"database/sql"
	"time"

	"github-clone/config"

	"github.com/google/uuid"
)

// SSHKey represents a user's SSH public key
type SSHKey struct {
	ID          string    `json:"id"`
	UserID      string    `json:"user_id"`
	Name        string    `json:"name"`
	PublicKey   string    `json:"public_key"`
	Fingerprint string    `json:"fingerprint"`
	CreatedAt   time.Time `json:"created_at"`
}

// SSHKeyInput is used for creating SSH keys
type SSHKeyInput struct {
	Name      string `json:"name"`
	PublicKey string `json:"public_key"`
}

// CreateSSHKey adds a new SSH key for a user
func CreateSSHKey(userID string, input SSHKeyInput, fingerprint string) (*SSHKey, error) {
	id := uuid.New().String()
	now := time.Now()

	sshKey := &SSHKey{
		ID:          id,
		UserID:      userID,
		Name:        input.Name,
		PublicKey:   input.PublicKey,
		Fingerprint: fingerprint,
		CreatedAt:   now,
	}

	// Insert the SSH key into the database
	_, err := config.DB.Exec(
		"INSERT INTO ssh_keys (id, user_id, name, public_key, fingerprint, created_at) VALUES (?, ?, ?, ?, ?, ?)",
		sshKey.ID, sshKey.UserID, sshKey.Name, sshKey.PublicKey, sshKey.Fingerprint, sshKey.CreatedAt,
	)

	if err != nil {
		return nil, err
	}

	return sshKey, nil
}

func GetSSHKeysByUserID(userID string) ([]*SSHKey, error) {
	rows, err := config.DB.Query(
		"SELECT id, user_id, name, public_key, fingerprint, created_at FROM ssh_keys WHERE user_id = ?",
		userID,
	)

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	keys := []*SSHKey{}

	for rows.Next() {
		var key SSHKey
		err := rows.Scan(&key.ID, &key.UserID, &key.Name, &key.PublicKey, &key.Fingerprint, &key.CreatedAt)
		if err != nil {
			return nil, err
		}
		keys = append(keys, &key)
	}

	return keys, nil
}

func GetAllSSHKeys() ([]*SSHKey, error) {
	rows, err := config.DB.Query(
		"SELECT id, user_id, name, public_key, fingerprint, created_at FROM ssh_keys",
	)

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	keys := []*SSHKey{}

	for rows.Next() {
		var key SSHKey
		err := rows.Scan(&key.ID, &key.UserID, &key.Name, &key.PublicKey, &key.Fingerprint, &key.CreatedAt)
		if err != nil {
			return nil, err
		}
		keys = append(keys, &key)
	}

	return keys, nil
}

func GetSSHKeyByID(id string) (*SSHKey, error) {
	var key SSHKey

	err := config.DB.QueryRow(
		"SELECT id, user_id, name, public_key, fingerprint, created_at FROM ssh_keys WHERE id = ?",
		id,
	).Scan(&key.ID, &key.UserID, &key.Name, &key.PublicKey, &key.Fingerprint, &key.CreatedAt)

	if err == sql.ErrNoRows {
		return nil, nil
	}

	if err != nil {
		return nil, err
	}

	return &key, nil
}

func GetUserBySSHKey(fingerprint string) (*User, error) {
	var user User

	err := config.DB.QueryRow(`
		SELECT u.id, u.username, u.email, u.password, u.created_at, u.updated_at 
		FROM users u
		JOIN ssh_keys s ON u.id = s.user_id
		WHERE s.fingerprint = ?`,
		fingerprint).Scan(&user.ID, &user.Username, &user.Email, &user.Password, &user.CreatedAt, &user.UpdatedAt)

	if err == sql.ErrNoRows {
		return nil, nil
	}

	if err != nil {
		return nil, err
	}

	return &user, nil
}

func DeleteSSHKey(id string) error {
	_, err := config.DB.Exec("DELETE FROM ssh_keys WHERE id = ?", id)
	return err
}
