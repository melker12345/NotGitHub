import api from './api';

const repositoryService = {
  /**
   * Get all repositories for the authenticated user
   * @returns {Promise} Promise with the list of repositories
   */
  getUserRepositories: async () => {
    const response = await api.get('/repositories');
    return response.data;
  },

  /**
   * Get a specific repository by username and repository name
   * @param {string} username Username of the repository owner
   * @param {string} repoName Repository name
   * @returns {Promise} Promise with the repository data
   */
  getRepositoryByPath: async (username, repoName) => {
    // Add the API prefix to the GitHub-style URL
    const response = await api.get(`/${username}/${repoName}`, {
      baseURL: 'http://localhost:8080/api' // Explicitly set the base URL to ensure API prefix
    });
    return response.data;
  },
  
  /**
   * Create a new repository
   * @param {Object} repositoryData Repository data with name, description, and visibility
   * @returns {Promise} Promise with the created repository data
   */
  createRepository: async (repositoryData) => {
    const response = await api.post('/repositories', repositoryData);
    return response.data;
  },
  
  /**
   * Update an existing repository
   * @param {string} username Username of the repository owner
   * @param {string} repoName Repository name
   * @param {Object} repositoryData Updated repository data
   * @returns {Promise} Promise with the updated repository data
   */
  updateRepositoryByPath: async (username, repoName, repositoryData) => {
    const response = await api.put(`/${username}/${repoName}`, repositoryData, {
      baseURL: 'http://localhost:8080/api'
    });
    return response.data;
  },

  /**
   * Delete a repository
   * @param {string} username Username of the repository owner
   * @param {string} repoName Repository name
   * @returns {Promise} Promise with the response
   */
  deleteRepositoryByPath: async (username, repoName) => {
    const response = await api.delete(`/${username}/${repoName}`, {
      baseURL: 'http://localhost:8080/api'
    });
    return response.data;
  },

  /**
   * Generate clone URLs for a repository
   * @param {Object} repository Repository object
   * @returns {Object} Object containing HTTPS and SSH clone URLs
   */
  getCloneUrls: (repository) => {
    if (!repository || !repository.owner) {
      console.error('Repository or repository owner is undefined');
      return {
        https: '',
        ssh: ''
      };
    }

    const username = repository.owner.username;
    const repoName = repository.name;
    
    // GitHub-style URLs
    return {
      https: `http://localhost:8080/${username}/${repoName}.git`,
      ssh: `ssh://git@localhost:8080/${username}/${repoName}.git`
    };
  },
  
  /**
   * Get statistics for a specific user
   * @param {string} username Username to get statistics for
   * @returns {Promise} Promise with the user statistics
   */
  getUserStats: async (username) => {
    const response = await api.get(`/users/${username}/stats`, {
      baseURL: 'http://localhost:8080/api'
    });
    return response.data;
  }
};

export default repositoryService;
