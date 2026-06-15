import axios from 'axios';

// Create a central instance
const api = axios.create({
  baseURL: 'http://localhost:3000/api', // Make sure this matches your Node.js port!
  headers: {
    'Content-Type': 'application/json',
  },
});

// Optional: Add an interceptor to automatically attach the JWT token to future requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;