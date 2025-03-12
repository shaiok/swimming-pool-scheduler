// src/api/apiClient.ts
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// In your API client configuration
const apiClient = axios.create({
  baseURL: "http://192.168.1.92:5000/api", // Your local network IP
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

apiClient.interceptors.request.use(
  async (config) => {
    // Retrieve token from AsyncStorage
    const token = await AsyncStorage.getItem("jwtToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for better error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error Response:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default apiClient;
