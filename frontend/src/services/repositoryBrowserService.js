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
    try {
      // First try to access as authenticated user
      console.log(`Fetching contents for ${username}/${repoName}, path: ${path}`);
      const response = await api.get(`/${username}/${repoName}/contents`, {
        params: { path, ref },
        baseURL: 'http://localhost:8080/api'
      });
      console.log('API response:', response);
      console.log('Contents data:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error accessing authenticated endpoint:', error);
      // If unauthorized, try the public endpoint
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        console.log('Using public endpoint for repository contents');
        const publicResponse = await api.get(`/public/${username}/${repoName}/contents`, {
          params: { path, ref },
          baseURL: 'http://localhost:8080/api'
        });
        console.log('Public API response:', publicResponse);
        console.log('Public contents data:', publicResponse.data);
        return publicResponse.data;
      }
      throw error; // Re-throw if it's not an auth error
    }
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
    if (!path) {
      throw new Error('Path parameter is required to fetch file content');
    }
    
    console.log(`Fetching file content for ${username}/${repoName}, path: ${path}, ref: ${ref}`);
    
    try {
      // First try to access as authenticated user
      const response = await api.get(`/${username}/${repoName}/file`, {
        params: { path, ref },
        baseURL: 'http://localhost:8080/api'
      });
      console.log('File content API response:', response);
      return response.data;
    } catch (error) {
      console.error('Error accessing authenticated file endpoint:', error);
      
      // If unauthorized, try the public endpoint
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        console.log('Using public endpoint for file content');
        const publicResponse = await api.get(`/public/${username}/${repoName}/file`, {
          params: { path, ref },
          baseURL: 'http://localhost:8080/api'
        });
        console.log('Public file content API response:', publicResponse);
        return publicResponse.data;
      }
      throw error; // Re-throw if it's not an auth error
    }
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
