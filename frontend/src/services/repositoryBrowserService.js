import api from './api';

const repositoryBrowserService = {
  /**
   * Get repository contents using GitHub-style path (username/reponame)
   * @param {string} username - Repository owner username
   * @param {string} repoName - Repository name
   * @param {string} path - Path within the repository (default: root)
   * @param {string} ref - Git reference (branch, tag, commit SHA) (default: HEAD)
   * @returns {Promise} - Promise with repository contents
   */
  getContentsByPath: async (username, repoName, path = '', ref = 'HEAD') => {
    const response = await api.get(`/${username}/${repoName}/contents`, {
      params: { path, ref },
      baseURL: 'http://localhost:8080/api' // Explicitly set the base URL to ensure API prefix
    });
    return response.data;
  },

  /**
   * Get file content using GitHub-style path (username/reponame)
   * @param {string} username - Repository owner username
   * @param {string} repoName - Repository name
   * @param {string} path - Path to the file within the repository
   * @param {string} ref - Git reference (branch, tag, commit SHA) (default: HEAD)
   * @returns {Promise} - Promise with file content
   */
  getFileContentByPath: async (username, repoName, path, ref = 'HEAD') => {
    const response = await api.get(`/${username}/${repoName}/file`, {
      params: { path, ref },
      baseURL: 'http://localhost:8080/api' // Explicitly set the base URL to ensure API prefix
    });
    return response.data;
  },

  /**
   * Get commit history using GitHub-style path (username/reponame)
   * @param {string} username - Repository owner username
   * @param {string} repoName - Repository name
   * @param {string} ref - Git reference (branch, tag, commit SHA) (default: HEAD)
   * @param {number} limit - Maximum number of commits to retrieve (default: 10)
   * @returns {Promise} - Promise with commit history
   */
  getCommitHistoryByPath: async (username, repoName, ref = 'HEAD', limit = 10) => {
    const response = await api.get(`/${username}/${repoName}/commits`, {
      params: { ref, limit },
      baseURL: 'http://localhost:8080/api' // Explicitly set the base URL to ensure API prefix
    });
    return response.data;
  }
};

export default repositoryBrowserService;
