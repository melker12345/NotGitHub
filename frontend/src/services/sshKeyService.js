import api from './api';

const sshKeyService = {
  /**
   * Add a new SSH key
   * @param {Object} keyData - Key data with name and public key
   * @returns {Promise} - Promise with the created key data
   */
  addKey: async (keyData) => {
    const response = await api.post('/ssh-keys', keyData);
    return response.data;
  },

  /**
   * Get all SSH keys for the authenticated user
   * @returns {Promise} - Promise with the list of SSH keys
   */
  getKeys: async () => {
    const response = await api.get('/ssh-keys');
    return response.data;
  },

  /**
   * Delete an SSH key by ID
   * @param {string} id - SSH key ID
   * @returns {Promise} - Promise with the response
   */
  deleteKey: async (id) => {
    const response = await api.delete(`/ssh-keys/${id}`);
    return response.data;
  }
};

export default sshKeyService;
