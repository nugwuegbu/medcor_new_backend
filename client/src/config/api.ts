/**
 * API Configuration for Frontend
 * This file centralizes all API endpoints and configurations
 */

// API Base URL - will be different for development vs production
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    SIGNUP: `${API_BASE_URL}/api/auth/signup`,
    LOGOUT: `${API_BASE_URL}/api/auth/logout`,
    ME: `${API_BASE_URL}/api/auth/me`,
    FACE_LOGIN: `${API_BASE_URL}/api/auth/face-login`,
    REGISTER_FACE: `${API_BASE_URL}/api/auth/register-face`,
    UPDATE_PHONE: `${API_BASE_URL}/api/auth/update-phone`,
  },
  
  // Medical Platform
  DOCTORS: `${API_BASE_URL}/api/doctors`,
  APPOINTMENTS: {
    LIST: `${API_BASE_URL}/api/appointments`,
    CREATE: `${API_BASE_URL}/api/appointments/create`,
  },
  
  // Chat System
  CHAT: {
    MESSAGES: `${API_BASE_URL}/api/chat/messages`,
    CREATE: `${API_BASE_URL}/api/chat/messages/create`,
  },
  
  // Analysis Tools
  ANALYSIS: {
    HAIR: `${API_BASE_URL}/api/hair-analysis`,
    SKIN: `${API_BASE_URL}/api/skin-analysis`,
    LIPS: `${API_BASE_URL}/api/lips-analysis`,
  },
  
  // Admin Panel
  ADMIN: {
    STATS: `${API_BASE_URL}/api/admin/stats`,
    USERS: `${API_BASE_URL}/api/admin/users`,
    DOCTORS: `${API_BASE_URL}/api/admin/doctors`,
    APPOINTMENTS: `${API_BASE_URL}/api/admin/appointments`,
  },
  
  // Utilities
  LOCATION_WEATHER: `${API_BASE_URL}/api/location-weather`,
  UPLOAD: `${API_BASE_URL}/api/upload`,
  DOWNLOAD_PACKAGE: `${API_BASE_URL}/api/download-frontend-package`,
};

// API Configuration
export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  TIMEOUT: 30000, // 30 seconds
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

// Authentication configuration
export const AUTH_CONFIG = {
  TOKEN_KEY: 'medcor_auth_token',
  REFRESH_TOKEN_KEY: 'medcor_refresh_token',
  TOKEN_EXPIRES_KEY: 'medcor_token_expires',
};

// External API configurations (will be handled by backend)
export const EXTERNAL_APIS = {
  HEYGEN: {
    // HeyGen configuration will be handled by backend
    STREAMING_URL: 'https://api.heygen.com/v2/streaming',
  },
  YOUCAM: {
    // YouCam configuration will be handled by backend
    BASE_URL: 'https://api.youcam.com',
  },
  AZURE_FACE: {
    // Azure Face API will be handled by backend
    BASE_URL: 'https://api.cognitive.microsoft.com',
  },
};

// Environment-specific configurations
export const ENV_CONFIG = {
  isDevelopment: import.meta.env.MODE === 'development',
  isProduction: import.meta.env.MODE === 'production',
  apiUrl: API_BASE_URL,
  version: import.meta.env.VITE_APP_VERSION || '1.0.0',
};

// Error handling configuration
export const ERROR_CONFIG = {
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
  NETWORK_ERROR_MESSAGE: 'Network error. Please check your connection.',
  SERVER_ERROR_MESSAGE: 'Server error. Please try again later.',
  UNAUTHORIZED_MESSAGE: 'You are not authorized. Please log in.',
};

export default {
  API_ENDPOINTS,
  API_CONFIG,
  AUTH_CONFIG,
  EXTERNAL_APIS,
  ENV_CONFIG,
  ERROR_CONFIG,
};