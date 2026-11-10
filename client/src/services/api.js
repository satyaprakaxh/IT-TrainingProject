import axios from 'axios';

/**
 * API Service Client
 * Responsibility: Centralized Axios instance configuration and API request definitions.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api'
});

export default api;

