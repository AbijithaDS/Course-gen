// API Base URL configuration
// In development: defaults to localhost:5000 unless VITE_API_BASE_URL is set
// In production: defaults to the Render deployment unless VITE_API_BASE_URL is set
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.DEV ? 'http://localhost:5000' : 'https://course-gen-backend.onrender.com');
