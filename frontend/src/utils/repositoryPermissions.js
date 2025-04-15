/**
 * Utility functions for checking repository permissions
 */
import { getToken } from '../services/authService';

/**
 * Check if the current user has access to a repository
 * @param {Object} repository - Repository object with owner_id and is_public properties
 * @param {Object|null} currentUser - Current user object (null if not authenticated)
 * @returns {boolean} - True if user has access, false otherwise
 */
export const hasRepositoryAccess = (repository, currentUser) => {
  // Public repositories are accessible to everyone
  if (repository.is_public) {
    return true;
  }
  
  // If not public, check if user is the owner
  return currentUser && repository.owner_id === currentUser.id;
};

/**
 * Check if the current user can edit a repository
 * @param {Object} repository - Repository object with owner_id
 * @param {Object|null} currentUser - Current user object (null if not authenticated)
 * @returns {boolean} - True if user can edit, false otherwise
 */
export const canEditRepository = (repository, currentUser) => {
  // Only the owner can edit the repository
  return currentUser && repository.owner_id === currentUser.id;
};

/**
 * Check if the current user is authenticated
 * @returns {boolean} - True if authenticated, false otherwise
 */
export const isAuthenticated = () => {
  return !!getToken();
};

/**
 * Determine the appropriate API endpoint based on authentication status
 * @param {string} authenticatedEndpoint - Endpoint to use if authenticated
 * @param {string} publicEndpoint - Endpoint to use if not authenticated
 * @returns {string} - The appropriate endpoint
 */
export const getAppropriateEndpoint = (authenticatedEndpoint, publicEndpoint) => {
  return isAuthenticated() ? authenticatedEndpoint : publicEndpoint;
};

/**
 * Format repository visibility for display
 * @param {boolean} isPublic - Whether the repository is public
 * @returns {Object} - Object with label and CSS class
 */
export const formatVisibility = (isPublic) => {
  return {
    label: isPublic ? 'Public' : 'Private',
    className: isPublic 
      ? 'bg-green-100 text-green-800' 
      : 'bg-yellow-100 text-yellow-800'
  };
};
