/**
 * Utility functions for repository access control
 */
import { repositoryService } from '../services/api';
import { getToken } from '../services/authService';

/**
 * Check if the current user has access to a repository
 * @param {string} username - Repository owner username
 * @param {string} repoName - Repository name
 * @returns {Promise<boolean>} - Promise resolving to true if user has access
 */
export const checkRepositoryAccess = async (username, repoName) => {
  try {
    // If user is authenticated, check through authenticated endpoint
    if (getToken()) {
      await repositoryService.getRepositoryByPath(username, repoName);
      return true;
    }
    
    // If not authenticated, check if the repository is public
    return await repositoryService.isRepositoryPublic(username, repoName);
  } catch (error) {
    // If we get a 404, user doesn't have access
    if (error.response && error.response.status === 404) {
      return false;
    }
    
    // For other errors, re-throw
    throw error;
  }
};

/**
 * Get repository with appropriate access control
 * @param {string} username - Repository owner username
 * @param {string} repoName - Repository name
 * @returns {Promise<Object>} - Promise resolving to repository object if accessible
 */
export const getRepositoryWithAccessControl = async (username, repoName) => {
  try {
    const response = await repositoryService.getRepositoryByPath(username, repoName);
    return response.data;
  } catch (error) {
    // Add more context to the error
    if (error.response && error.response.status === 404) {
      error.message = `Repository ${username}/${repoName} not found or you don't have access to it`;
    } else if (error.response && error.response.status === 403) {
      error.message = `You don't have permission to access ${username}/${repoName}`;
    }
    throw error;
  }
};

/**
 * Handle repository access errors
 * @param {Error} error - Error object
 * @returns {Object} - Object with error message and status
 */
export const handleRepositoryAccessError = (error) => {
  let message = 'An error occurred while accessing the repository';
  let status = 500;
  
  if (error.response) {
    status = error.response.status;
    
    if (status === 404) {
      message = 'Repository not found or you don\'t have access to it';
    } else if (status === 403) {
      message = 'You don\'t have permission to access this repository';
    } else if (status === 401) {
      message = 'Authentication required to access this repository';
    } else {
      message = error.message || 'An error occurred while accessing the repository';
    }
  }
  
  return { message, status };
};
