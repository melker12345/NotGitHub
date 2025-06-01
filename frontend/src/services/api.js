import axios from 'axios';

// Base URL for API requests
const API_URL = 'http://localhost:8080/api';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests when available
api.interceptors.request.use(
  (config) => {
    // Check for either token name for backward compatibility
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Authentication Services
export const authService = {
  register: (userData) => {
    return api.post('/auth/register', userData);
  },
  login: (credentials) => {
    return api.post('/auth/login', credentials);
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};

// Repository Services
export const repositoryService = {
  // Get all repositories for the authenticated user
  getUserRepositories: () => {
    return api.get('/repositories');
  },
  
  // Get a repository by username and repository name (GitHub-style URL)
  // Will automatically try public endpoint if authenticated request fails
  getRepositoryByPath: async (username, repoName) => {
    try {
      // First try as authenticated user
      return await api.get(`/${username}/${repoName}`, {
        baseURL: API_URL
      });
    } catch (error) {
      // If unauthorized or forbidden, try the public endpoint
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        return await api.get(`/public/${username}/${repoName}`, {
          baseURL: API_URL
        });
      }
      throw error;
    }
  },
  
  // Create a new repository
  createRepository: (repositoryData) => {
    return api.post('/repositories', repositoryData);
  },
  
  // Update a repository by username and repository name (GitHub-style URL)
  updateRepositoryByPath: (username, repoName, repositoryData) => {
    return api.put(`/${username}/${repoName}`, repositoryData, {
      baseURL: API_URL
    });
  },
  
  // Delete a repository by username and repository name (GitHub-style URL)
  deleteRepositoryByPath: (username, repoName) => {
    return api.delete(`/${username}/${repoName}`, {
      baseURL: API_URL
    });
  },
  
  // Get all public repositories with pagination
  // Note: Backend doesn't support sorting yet, so we ignore the sort parameter
  getPublicRepositories: (limit = 20, offset = 0, sort = 'newest') => {
    return api.get('/repositories/public', {
      params: { limit, offset, sort }
    }).then(response => {
      // Ensure each repository has owner information
      if (response.data && Array.isArray(response.data)) {
        return response.data.map(repo => {
          // Make sure owner is properly structured
          if (!repo.owner && repo.owner_id) {
            // If we have owner_username but no owner object, create one
            if (repo.owner_username) {
              repo.owner = {
                id: repo.owner_id,
                username: repo.owner_username,
                email: repo.owner_email || ''
              };
            }
          }
          return repo;
        });
      }
      return response.data;
    });
  },
  
  // Get public repositories for a specific user with pagination
  // Note: Backend doesn't support sorting yet, so we ignore the sort parameter
  getUserPublicRepositories: (username, limit = 20, offset = 0, sort = 'newest') => {
    return api.get('/repositories/user', {
      params: { username, limit, offset, sort }
    }).then(response => {
      // Ensure each repository has owner information
      if (response.data && Array.isArray(response.data)) {
        return response.data.map(repo => {
          // Make sure owner is properly structured
          if (!repo.owner && repo.owner_id) {
            // If we have owner_username but no owner object, create one
            if (repo.owner_username || username) {
              repo.owner = {
                id: repo.owner_id,
                username: repo.owner_username || username,
                email: repo.owner_email || ''
              };
            }
          }
          return repo;
        });
      }
      return response.data;
    });
  },
  
  // TODO: Implement search functionality in a future commit
  // searchPublicRepositories: (query, limit = 20, offset = 0) => {
  //   return api.get('/repositories/search', {
  //     params: { query, limit, offset }
  //   });
  // },

  // Issue Management Functions
  
  // Get all issues for a repository with pagination and filtering
  getRepositoryIssues: (username, repoName, limit = 10, offset = 0, isOpen = null) => {
    const params = { limit, offset };
    
    // Add is_open filter if specified
    if (isOpen !== null) {
      params.is_open = isOpen;
    }
    
    return api.get(`/repos/${username}/${repoName}/issues`, { params })
    .then(response => {
      // If no data or empty array, return empty array to avoid null errors
      if (!response.data) return [];
      return response.data;
    })
    .catch(error => {
      // For 404 errors (no issues found), return empty array instead of throwing
      if (error.response && error.response.status === 404) {
        return [];
      }
      console.error('Error fetching repository issues:', error);
      throw error;
    });
  },
  
  // Get a specific issue by ID
  getIssue: (username, repoName, issueId) => {
    return api.get(`/repos/${username}/${repoName}/issues/${issueId}`)
      .then(response => response.data)
      .catch(error => {
        console.error('Error fetching issue details:', error);
        throw error;
      });
  },
  
  // Create a new issue
  createIssue: (username, repoName, issueData) => {
    return api.post(`/repos/${username}/${repoName}/issues`, issueData)
      .then(response => response.data)
      .catch(error => {
        console.error('Error creating issue:', error);
        throw error;
      });
  },
  
  // Update an issue's status (open/closed)
  updateIssueStatus: (username, repoName, issueId, statusData) => {
    return api.patch(`/repos/${username}/${repoName}/issues/${issueId}`, statusData)
      .then(response => {
        // Make sure we have valid data before returning
        if (response && response.data) {
          return response.data;
        }
        return null;
      })
      .catch(error => {
        // Log the error for debugging
        console.error('Error updating issue status:', error);
        
        // For CORS errors, check if the backend server has PATCH in the allowed methods
        if (error.message && error.message.includes('Network Error')) {
          console.warn('Possible CORS issue. Make sure the backend allows PATCH requests.');
        }
        
        throw error;
      });
  },
  
  // Vote on an issue (upvote/downvote)
  voteOnIssue: (username, repoName, issueId, voteData) => {
    return api.post(`/repos/${username}/${repoName}/issues/${issueId}/vote`, voteData)
      .then(response => response.data)
      .catch(error => {
        console.error('Error voting on issue:', error);
        throw error;
      });
  },
  
  // Remove a vote from an issue
  removeIssueVote: (username, repoName, issueId) => {
    return api.delete(`/repos/${username}/${repoName}/issues/${issueId}/vote`)
      .then(response => response.data)
      .catch(error => {
        console.error('Error removing vote:', error);
        throw error;
      });
  },
  
  // Generate clone URLs for a repository
  getCloneUrls: (repository) => {
    if (!repository) {
      return { https: '', ssh: '' };
    }
    
    const baseUrl = API_URL.replace('/api', '');
    const hostname = new URL(baseUrl).hostname;
    
    // Use the Git HTTP protocol endpoint
    const httpsUrl = `${baseUrl}/git/${repository.owner?.username}/${repository.name}.git`;
    
    // Use SSH URL format with explicit port
    const sshUrl = `ssh://git@${hostname}:2222/${repository.owner?.username}/${repository.name}.git`;
    
    return {
      https: httpsUrl,
      ssh: sshUrl
    };
  },
  
  // Check if a repository is public
  isRepositoryPublic: async (username, repoName) => {
    try {
      await api.get(`/public/${username}/${repoName}`, {
        baseURL: API_URL
      });
      return true; // If the request succeeds, the repo is public
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return false; // Repository not found publicly
      }
      throw error; // Other errors should be propagated
    }
  },
  
  // Get repository statistics (stars, forks, etc.)
  getRepositoryStats: async (username, repoName) => {
    try {
      const response = await api.get(`/${username}/${repoName}/stats`, {
        baseURL: API_URL
      });
      return response.data;
    } catch (error) {
      // If unauthorized, try the public endpoint
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        const publicResponse = await api.get(`/public/${username}/${repoName}/stats`, {
          baseURL: API_URL
        });
        return publicResponse.data;
      }
      throw error;
    }
  },
  
  // Generate a new long-lived Git access token for the authenticated user
  generateGitAccessToken: () => {
    return api.post('/user/git-access-token'); 
  },

  // Get statistics for a specific user
  getUserStats: async (username) => {
    try {
      const response = await api.get(`/users/${username}/stats`, {
        baseURL: API_URL
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching user stats: ${error}`);
      throw error;
    }
  },
};

// Add a global response interceptor to handle session expiry (401/403)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Remove tokens and user info
      localStorage.removeItem('token');
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      // Redirect to login page
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
