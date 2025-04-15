/**
 * Utility functions for checking repository access permissions
 */
import { isAuthenticated } from './repositoryPermissions';

/**
 * Check if the current user can view a repository
 * @param {Object} repository - Repository object
 * @param {Object|null} currentUser - Current user object
 * @returns {boolean} - True if user can view the repository
 */
export const canViewRepository = (repository, currentUser) => {
  // Public repositories can be viewed by anyone
  if (repository.is_public) {
    return true;
  }
  
  // Private repositories can only be viewed by the owner
  return currentUser && repository.owner_id === currentUser.id;
};

/**
 * Check if the current user can edit a repository
 * @param {Object} repository - Repository object
 * @param {Object|null} currentUser - Current user object
 * @returns {boolean} - True if user can edit the repository
 */
export const canEditRepository = (repository, currentUser) => {
  // Only the owner can edit the repository
  return currentUser && repository.owner_id === currentUser.id;
};

/**
 * Check if the current user can delete a repository
 * @param {Object} repository - Repository object
 * @param {Object|null} currentUser - Current user object
 * @returns {boolean} - True if user can delete the repository
 */
export const canDeleteRepository = (repository, currentUser) => {
  // Only the owner can delete the repository
  return currentUser && repository.owner_id === currentUser.id;
};

/**
 * Check if the current user can view repository contents
 * @param {Object} repository - Repository object
 * @param {Object|null} currentUser - Current user object
 * @returns {boolean} - True if user can view repository contents
 */
export const canViewRepositoryContents = (repository, currentUser) => {
  // Public repositories contents can be viewed by anyone
  if (repository.is_public) {
    return true;
  }
  
  // Private repositories contents can only be viewed by the owner
  return currentUser && repository.owner_id === currentUser.id;
};

/**
 * Get appropriate API endpoint based on repository visibility and user authentication
 * @param {Object} repository - Repository object
 * @param {string} authenticatedEndpoint - Endpoint for authenticated users
 * @param {string} publicEndpoint - Endpoint for public access
 * @returns {string} - Appropriate endpoint
 */
export const getRepositoryEndpoint = (repository, authenticatedEndpoint, publicEndpoint) => {
  // If user is authenticated, use authenticated endpoint
  if (isAuthenticated()) {
    return authenticatedEndpoint;
  }
  
  // If repository is public, use public endpoint
  if (repository.is_public) {
    return publicEndpoint;
  }
  
  // Default to authenticated endpoint (will fail if user is not authenticated)
  return authenticatedEndpoint;
};
