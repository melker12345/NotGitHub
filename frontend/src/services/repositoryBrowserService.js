import api from './api';
import { getAppropriateEndpoint, isAuthenticated } from '../utils/repositoryPermissions';

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
      // Determine the appropriate endpoint based on authentication status
      const endpoint = isAuthenticated() 
        ? `/${username}/${repoName}/contents` 
        : `/public/${username}/${repoName}/contents`;
      
      const response = await api.get(endpoint, {
        params: { path, ref },
        baseURL: 'http://localhost:8080/api'
      });
      
      // Process response data for consistent format
      let processedData = response.data;
      
      // Normalize data structure (handle different case conventions)
      if (Array.isArray(processedData)) {
        processedData = processedData.map(item => ({
          name: item.name || item.Name,
          path: item.path || item.Path,
          type: item.type || item.Type,
          size: item.size || item.Size,
          sha: item.sha || item.Sha,
          url: item.url || item.Url,
          download_url: item.download_url || item.Download_url,
        }));
      }
      
      return processedData;
    } catch (error) {
      // If authenticated request fails with 401/403, try public endpoint
      if (isAuthenticated() && 
          error.response && 
          (error.response.status === 401 || error.response.status === 403)) {
        try {
          const publicResponse = await api.get(`/public/${username}/${repoName}/contents`, {
            params: { path, ref },
            baseURL: 'http://localhost:8080/api'
          });
          
          // Process response data for consistent format
          let processedData = publicResponse.data;
          
          // Normalize data structure (handle different case conventions)
          if (Array.isArray(processedData)) {
            processedData = processedData.map(item => ({
              name: item.name || item.Name,
              path: item.path || item.Path,
              type: item.type || item.Type,
              size: item.size || item.Size,
              sha: item.sha || item.Sha,
              url: item.url || item.Url,
              download_url: item.download_url || item.Download_url,
            }));
          }
          
          return processedData;
        } catch (publicError) {
          throw publicError;
        }
      }
      
      // Add more context to the error
      if (error.response && error.response.status === 404) {
        error.message = `Repository ${username}/${repoName} not found or you don't have access to it`;
      } else if (error.response && error.response.status === 403) {
        error.message = `You don't have permission to access ${username}/${repoName}`;
      }
      
      throw error;
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
    
    try {
      // Determine the appropriate endpoint based on authentication status
      const endpoint = isAuthenticated() 
        ? `/${username}/${repoName}/file` 
        : `/public/${username}/${repoName}/file`;
      
      const response = await api.get(endpoint, {
        params: { path, ref },
        baseURL: 'http://localhost:8080/api'
      });
      
      // Process response data for consistent format
      let fileData = response.data;
      
      // Normalize data structure (handle different case conventions)
      return {
        name: fileData.name || fileData.Name,
        path: fileData.path || fileData.Path,
        content: fileData.content || fileData.Content,
        encoding: fileData.encoding || fileData.Encoding,
        size: fileData.size || fileData.Size,
        sha: fileData.sha || fileData.Sha,
        type: fileData.type || fileData.Type,
        url: fileData.url || fileData.Url,
        download_url: fileData.download_url || fileData.Download_url,
        language: fileData.language || fileData.Language,
      };
    } catch (error) {
      // If authenticated request fails with 401/403, try public endpoint
      if (isAuthenticated() && 
          error.response && 
          (error.response.status === 401 || error.response.status === 403)) {
        try {
          const publicResponse = await api.get(`/public/${username}/${repoName}/file`, {
            params: { path, ref },
            baseURL: 'http://localhost:8080/api'
          });
          
          // Process response data for consistent format
          let fileData = publicResponse.data;
          
          // Normalize data structure (handle different case conventions)
          return {
            name: fileData.name || fileData.Name,
            path: fileData.path || fileData.Path,
            content: fileData.content || fileData.Content,
            encoding: fileData.encoding || fileData.Encoding,
            size: fileData.size || fileData.Size,
            sha: fileData.sha || fileData.Sha,
            type: fileData.type || fileData.Type,
            url: fileData.url || fileData.Url,
            download_url: fileData.download_url || fileData.Download_url,
            language: fileData.language || fileData.Language,
          };
        } catch (publicError) {
          // Add more context to the error
          if (publicError.response && publicError.response.status === 404) {
            publicError.message = `File not found: ${path} in ${username}/${repoName}`;
          } else if (publicError.response && publicError.response.status === 403) {
            publicError.message = `You don't have permission to access this file`;
          }
          throw publicError;
        }
      }
      
      // Add more context to the error
      if (error.response && error.response.status === 404) {
        error.message = `File not found: ${path} in ${username}/${repoName}`;
      } else if (error.response && error.response.status === 403) {
        error.message = `You don't have permission to access this file`;
      }
      
      throw error;
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
    try {
      // Determine the appropriate endpoint based on authentication status
      const endpoint = isAuthenticated() 
        ? `/${username}/${repoName}/commits` 
        : `/public/${username}/${repoName}/commits`;
      
      const response = await api.get(endpoint, {
        params: { ref, limit },
        baseURL: 'http://localhost:8080/api'
      });
      
      // Process response data for consistent format
      let commits = response.data;
      
      // Normalize data structure (handle different case conventions)
      if (Array.isArray(commits)) {
        commits = commits.map(commit => ({
          sha: commit.sha || commit.Sha,
          commit: commit.commit || commit.Commit,
          author: commit.author || commit.Author,
          committer: commit.committer || commit.Committer,
          parents: commit.parents || commit.Parents,
          message: commit.message || (commit.commit ? commit.commit.message : null) || 
                  (commit.Commit ? commit.Commit.message : null),
          date: commit.date || (commit.commit ? commit.commit.committer.date : null) || 
                (commit.Commit ? commit.Commit.committer.date : null),
        }));
      }
      
      return commits;
    } catch (error) {
      // If authenticated request fails with 401/403, try public endpoint
      if (isAuthenticated() && 
          error.response && 
          (error.response.status === 401 || error.response.status === 403)) {
        try {
          const publicResponse = await api.get(`/public/${username}/${repoName}/commits`, {
            params: { ref, limit },
            baseURL: 'http://localhost:8080/api'
          });
          
          // Process response data for consistent format
          let commits = publicResponse.data;
          
          // Normalize data structure (handle different case conventions)
          if (Array.isArray(commits)) {
            commits = commits.map(commit => ({
              sha: commit.sha || commit.Sha,
              commit: commit.commit || commit.Commit,
              author: commit.author || commit.Author,
              committer: commit.committer || commit.Committer,
              parents: commit.parents || commit.Parents,
              message: commit.message || (commit.commit ? commit.commit.message : null) || 
                      (commit.Commit ? commit.Commit.message : null),
              date: commit.date || (commit.commit ? commit.commit.committer.date : null) || 
                    (commit.Commit ? commit.Commit.committer.date : null),
            }));
          }
          
          return commits;
        } catch (publicError) {
          // Add more context to the error
          if (publicError.response && publicError.response.status === 404) {
            publicError.message = `Repository ${username}/${repoName} not found or you don't have access to it`;
          } else if (publicError.response && publicError.response.status === 403) {
            publicError.message = `You don't have permission to access ${username}/${repoName}`;
          }
          throw publicError;
        }
      }
      
      // Add more context to the error
      if (error.response && error.response.status === 404) {
        error.message = `Repository ${username}/${repoName} not found or you don't have access to it`;
      } else if (error.response && error.response.status === 403) {
        error.message = `You don't have permission to access ${username}/${repoName}`;
      }
      
      throw error;
    }
  }
};

export default repositoryBrowserService;
