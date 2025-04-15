package utils

// RepoAccessChecker interface for repository access permission checks
type RepoAccessChecker interface {
	// CanViewRepository checks if a user has permission to view a repository
	CanViewRepository(repoOwnerID string, isPublic bool, userID string) bool
	
	// CanEditRepository checks if a user has permission to edit a repository
	CanEditRepository(repoOwnerID string, userID string) bool
	
	// CanCloneRepository checks if a user has permission to clone a repository
	CanCloneRepository(repoOwnerID string, isPublic bool, userID string) bool
	
	// CanPushToRepository checks if a user has permission to push to a repository
	CanPushToRepository(repoOwnerID string, userID string) bool
}

// DefaultRepoAccess implements the RepoAccessChecker interface
type DefaultRepoAccess struct{}

// CanViewRepository checks if a user has permission to view a repository
// Returns true if:
// 1. The repository is public, or
// 2. The user is the owner of the repository
func (ra *DefaultRepoAccess) CanViewRepository(repoOwnerID string, isPublic bool, userID string) bool {
	// Public repositories can be viewed by anyone
	if isPublic {
		return true
	}
	
	// Private repositories can only be viewed by their owners
	return repoOwnerID == userID
}

// CanEditRepository checks if a user has permission to edit a repository
// Returns true if the user is the owner of the repository
func (ra *DefaultRepoAccess) CanEditRepository(repoOwnerID string, userID string) bool {
	if userID == "" {
		return false
	}
	
	// Only repository owners can edit
	return repoOwnerID == userID
}

// CanCloneRepository checks if a user has permission to clone a repository
// This is the same as viewing permission
func (ra *DefaultRepoAccess) CanCloneRepository(repoOwnerID string, isPublic bool, userID string) bool {
	return ra.CanViewRepository(repoOwnerID, isPublic, userID)
}

// CanPushToRepository checks if a user has permission to push to a repository
// This is the same as edit permission
func (ra *DefaultRepoAccess) CanPushToRepository(repoOwnerID string, userID string) bool {
	return ra.CanEditRepository(repoOwnerID, userID)
}

// NewRepoAccess creates a new DefaultRepoAccess instance
func NewRepoAccess() *DefaultRepoAccess {
	return &DefaultRepoAccess{}
}
