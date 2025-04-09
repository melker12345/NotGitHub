import axios from 'axios';
import api from './api';

const sshKeyService = {
  /**
   * Add a new SSH key
   * @param {Object} keyData - Key data with name and public key
   * @returns {Promise} - Promise with the created key data
   */
  addKey: async (keyData) => {
    try {
      const response = await api.post('/ssh-keys', keyData);
      return response.data;
    } catch (error) {
      console.error('Error adding SSH key:', error);
      throw error;
    }
  },

  /**
   * Get all SSH keys for the authenticated user
   * @returns {Promise} - Promise with the list of SSH keys
   */
  getKeys: async () => {
    try {
      const response = await api.get('/ssh-keys');
      return response.data;
    } catch (error) {
      console.error('Error fetching SSH keys:', error);
      throw error;
    }
  },

  /**
   * Delete an SSH key by ID
   * @param {string} id - SSH key ID
   * @returns {Promise} - Promise with the response
   */
  deleteKey: async (id) => {
    try {
      // Use explicit URL to ensure correct endpoint
      await api.delete(`/ssh-keys/${id}`);
      // Return success even if no content (204 response)
      return { success: true };
    } catch (error) {
      console.error('Error deleting SSH key:', error);
      throw error;
    }
  }
};

export default sshKeyService;
