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
   * Get a specific repository by ID
   * @param {string} id Repository ID
   * @returns {Promise} Promise with the repository data
   */
  getRepository: async (id) => {
    const response = await api.get(`/repositories/${id}`);
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
   * @param {string} id Repository ID
   * @param {Object} repositoryData Updated repository data
   * @returns {Promise} Promise with the updated repository data
   */
  updateRepository: async (id, repositoryData) => {
    const response = await api.put(`/repositories/${id}`, repositoryData);
    return response.data;
  },
  
  /**
   * Delete a repository
   * @param {string} id Repository ID
   * @returns {Promise} Promise with the response
   */
  deleteRepository: async (id) => {
    const response = await api.delete(`/repositories/${id}`);
    return response.data;
  }
};

export default repositoryService;
