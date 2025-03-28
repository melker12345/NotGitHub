package handlers

import (
	"encoding/json"
	"net/http"

	"github-clone/models"
	"github-clone/ssh"

	"github.com/gorilla/mux"
)

// AddSSHKey handles adding a new SSH key for a user
func AddSSHKey(w http.ResponseWriter, r *http.Request) {
	// Get the authenticated user ID from the request
	userID, err := getUserIDFromRequest(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Parse the request body
	var input models.SSHKeyInput
	err = json.NewDecoder(r.Body).Decode(&input)
	if err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	// Validate input
	if input.Name == "" || input.PublicKey == "" {
		http.Error(w, "Name and public key are required", http.StatusBadRequest)
		return
	}

	// Parse the public key to get its fingerprint
	fingerprint, err := ssh.ParsePublicKey(input.PublicKey)
	if err != nil {
		http.Error(w, "Invalid SSH public key: "+err.Error(), http.StatusBadRequest)
		return
	}

	// Create the SSH key
	sshKey, err := models.CreateSSHKey(userID, input, fingerprint)
	if err != nil {
		http.Error(w, "Failed to add SSH key: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Return success response
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(sshKey)
}

// GetSSHKeys handles retrieving all SSH keys for a user
func GetSSHKeys(w http.ResponseWriter, r *http.Request) {
	// Get the authenticated user ID from the request
	userID, err := getUserIDFromRequest(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Get the SSH keys
	keys, err := models.GetSSHKeysByUserID(userID)
	if err != nil {
		http.Error(w, "Failed to retrieve SSH keys", http.StatusInternalServerError)
		return
	}

	// Return success response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(keys)
}

// DeleteSSHKey handles removing an SSH key
func DeleteSSHKey(w http.ResponseWriter, r *http.Request) {
	// Get the authenticated user ID from the request
	userID, err := getUserIDFromRequest(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Get the SSH key ID from the URL
	vars := mux.Vars(r)
	keyID := vars["id"]

	// Get the key to verify ownership
	key, err := models.GetSSHKeyByID(keyID)
	if err != nil {
		http.Error(w, "Failed to retrieve SSH key", http.StatusInternalServerError)
		return
	}

	if key == nil {
		http.Error(w, "SSH key not found", http.StatusNotFound)
		return
	}

	// Check if user is the owner
	if key.UserID != userID {
		http.Error(w, "You don't have permission to delete this SSH key", http.StatusForbidden)
		return
	}

	// Delete the key
	err = models.DeleteSSHKey(keyID)
	if err != nil {
		http.Error(w, "Failed to delete SSH key: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Return success response
	w.WriteHeader(http.StatusNoContent)
}
