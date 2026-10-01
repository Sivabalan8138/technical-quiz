import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Add a request interceptor to add token and check cache
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Client-side caching logic for GET requests
    if (config.method?.toLowerCase() === 'get') {
      const key = `${config.url}?${new URLSearchParams(config.params || {}).toString()}`;
      const cachedResponse = cache.get(key);
      
      if (cachedResponse && Date.now() - cachedResponse.timestamp < CACHE_TTL) {
        // Serve instantly from cache
        config.adapter = () => Promise.resolve({
          data: cachedResponse.data,
          status: 200,
          statusText: 'OK',
          headers: config.headers,
          config,
          request: {}
        });
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to save successful GET requests to cache
api.interceptors.response.use(
  (response) => {
    if (response.config.method?.toLowerCase() === 'get') {
      const key = `${response.config.url}?${new URLSearchParams(response.config.params || {}).toString()}`;
      cache.set(key, { data: response.data, timestamp: Date.now() });
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
