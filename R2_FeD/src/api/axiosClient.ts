import axios from 'axios';

// Get base URL from environment variable or default to localhost:3001
const getBaseURL = () => {
  const envURL = import.meta.env.VITE_API_BASE;
  if (envURL) {
    return envURL;
  }
  // Default to localhost:3001
  return 'http://localhost:3001';
};

const baseURL = getBaseURL();
console.log('🌐 API Base URL:', baseURL);

const axiosClient = axios.create({
  baseURL: baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 500000,
});

// Add token automatically
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle responses
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status } = error.response;

      if (status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(new Error('Session expired. Please log in again.'));
      }

      if (status === 403) {
        return Promise.reject(new Error('You do not have permission to access this resource.'));
      }

      if (status >= 500) {
        return Promise.reject(new Error('Server error. Please try again later.'));
      }
    }

    if (error.message === 'Network Error' || error.code === 'ERR_CONNECTION_REFUSED') {
      return Promise.reject(new Error(`Network error. Unable to connect to backend server at ${baseURL}. Please ensure the backend server is running.`));
    }

    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('Request timeout. Please try again.'));
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
