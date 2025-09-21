import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://127.0.0.1:8000", // backend base URL
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptors can be added here (auth, logging, error handling, etc.)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response || error.message);
    return Promise.reject(error);
  }
);

export default apiClient;
