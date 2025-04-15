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
      // DEBUG: Log exactly what we're requesting
      // console.log('=== API REQUEST DETAILS ===');
      // console.log(`Repository: ${username}/${repoName}`);
      // console.log(`Path parameter: '${path}'`);
      // console.log(`Ref: ${ref}`);
      
      // First try to access as authenticated user
      const response = await api.get(`/${username}/${repoName}/contents`, {
        params: { path, ref },
        baseURL: 'http://localhost:8080/api'
      });
      
      // DEBUG: Log the full response JSON
      // console.log('=== API RESPONSE SUCCESS ===');
      // console.log(`Status: ${response.status}`);
      // console.log(`Data received for path '${path}':`, JSON.stringify(response.data, null, 2));
      
      // Check if the response is an array (should be for directory contents)
      if (Array.isArray(response.data)) {
        // console.log(`Received ${response.data.length} items in directory '${path}'`);
        // Log each item's type and path
        response.data.forEach((item, index) => {
          // console.log(`[${index}] ${item.type || item.Type}: ${item.name || item.Name} - Path: ${item.path || item.Path}`);
        });
      } else {
        // console.log(`Received non-array response for path '${path}'`, response.data);
      }
      
      return response.data;
    } catch (error) {
      // console.error(`=== API ERROR for path '${path}' ===`);
      // console.error(error);
      
      // If unauthorized, try the public endpoint
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        console.log('Using public endpoint for repository contents');
        try {
          const publicResponse = await api.get(`/public/${username}/${repoName}/contents`, {
            params: { path, ref },
            baseURL: 'http://localhost:8080/api'
          });
          
          // DEBUG: Log the full public response JSON
          // console.log('=== PUBLIC API RESPONSE SUCCESS ===');
          // console.log(`Status: ${publicResponse.status}`);
          // console.log(`Data received for path '${path}':`, JSON.stringify(publicResponse.data, null, 2));
          
          return publicResponse.data;
        } catch (publicError) {
          // console.error('=== PUBLIC API ERROR ===');
          // console.error(publicError);
          throw publicError;
        }
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
