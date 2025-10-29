import axios, { AxiosInstance } from "axios";

// Base URL of your Python server
const pythonBaseURL = process.env.PYTHON_BASE_URL || "http://localhost:8000";

// Create Axios instance
const axiosClient: AxiosInstance = axios.create({
  baseURL: pythonBaseURL,
  timeout: 5000, // 5 seconds timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// Optional: Add request interceptor (for logging, auth, etc.)
axiosClient.interceptors.request.use(
  (config) => {
    console.log(`[Axios] Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

// Optional: Add response interceptor
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("[Axios] Error:", error.message);
    return Promise.reject(error);
  }
);

export default axiosClient;
