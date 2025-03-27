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
    const token = localStorage.getItem('token');
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
  
  // Get a specific repository by ID
  getRepository: (id) => {
    return api.get(`/repositories/${id}`);
  },
  
  // Create a new repository
  createRepository: (repositoryData) => {
    return api.post('/repositories', repositoryData);
  },
  
  // Update an existing repository
  updateRepository: (id, repositoryData) => {
    return api.put(`/repositories/${id}`, repositoryData);
  },
  
  // Delete a repository
  deleteRepository: (id) => {
    return api.delete(`/repositories/${id}`);
  },
};

export default api;
