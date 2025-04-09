import axios from 'axios';

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
  getRepositoryByPath: (username, repoName) => {
    return api.get(`/${username}/${repoName}`, {
      baseURL: API_URL
    });
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
};

export default api;
