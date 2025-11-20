import axios, { AxiosInstance, AxiosError } from 'axios';

// API URL configuration
// Set via NEXT_PUBLIC_API_URL environment variable
// Development: http://localhost:3000
// Production: http://72.61.208.109:3000
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle 401 Unauthorized or 404 Not Found (when user doesn't exist)
    if (error.response?.status === 401 || 
        (error.response?.status === 404 && error.response?.config?.url?.includes('/auth/profile'))) {
      // Unauthorized or user not found - clear token and redirect to login
      // Only redirect if we're not already on the login page
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;

