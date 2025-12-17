import axios from 'axios';

// Create axios instance with CORRECT settings
const api = axios.create({
  baseURL: 'http://localhost:5000/api',  // CRITICAL: Must include '/api' suffix
  withCredentials: true,
  timeout: 10000
});

// Request interceptor for debugging
api.interceptors.request.use(config => {
  console.log('📡 API Request:', {
    url: config.url,
    method: config.method,
    withCredentials: config.withCredentials,
    baseURL: config.baseURL,
    fullURL: `${config.baseURL}${config.url}`
  });
  return config;
});

// Response interceptor
api.interceptors.response.use(
  response => response,
  error => {
    console.error('❌ API Error:', {
      url: error.config?.url,
      fullURL: `${error.config?.baseURL}${error.config?.url}`,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    return Promise.reject(error);
  }
);

export default api;