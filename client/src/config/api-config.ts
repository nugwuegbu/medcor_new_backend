/**
 * API Configuration for switching between Express and Django backends
 * Set USE_DJANGO_BACKEND to true to use the new Django implementation
 */

// Toggle this to switch between backends
const USE_DJANGO_BACKEND = true;

// Base URLs for different backends
const EXPRESS_BASE_URL = '';  // Current Express backend (same origin)
const DJANGO_BASE_URL = 'http://localhost:8002';  // Django backend on port 8002

// Get the appropriate base URL
export const API_BASE_URL = USE_DJANGO_BACKEND ? DJANGO_BASE_URL : EXPRESS_BASE_URL;

// API endpoint mappings
export const API_ENDPOINTS = {
  // Voice & Chat APIs
  VOICE_CHAT: USE_DJANGO_BACKEND ? `${DJANGO_BASE_URL}/api/chat/voice/` : '/api/chat/voice',
  TEXT_CHAT: USE_DJANGO_BACKEND ? `${DJANGO_BASE_URL}/api/chat/` : '/api/chat',
  
  // Speech Processing
  SPEECH_TO_TEXT: USE_DJANGO_BACKEND ? `${DJANGO_BASE_URL}/api/speech-to-text/` : '/api/speech-to-text',
  TEXT_TO_SPEECH: USE_DJANGO_BACKEND ? `${DJANGO_BASE_URL}/api/text-to-speech/` : '/api/text-to-speech',
  AVATAR_SPEECH_TO_TEXT: USE_DJANGO_BACKEND ? `${DJANGO_BASE_URL}/api/avatar/speech-to-text/` : '/api/avatar/speech-to-text',
  
  // Avatar Management
  AVATAR_STATUS: (sessionId: string) => USE_DJANGO_BACKEND 
    ? `${DJANGO_BASE_URL}/api/avatar/status/${sessionId}/` 
    : `/api/avatar/status/${sessionId}`,
  AVATAR_CREATE_SESSION: USE_DJANGO_BACKEND ? `${DJANGO_BASE_URL}/api/avatar/create-session/` : '/api/avatar/create-session',
  AVATAR_START_RECORDING: USE_DJANGO_BACKEND ? `${DJANGO_BASE_URL}/api/avatar/start-recording/` : '/api/avatar/start-recording',
  AVATAR_STOP_RECORDING: USE_DJANGO_BACKEND ? `${DJANGO_BASE_URL}/api/avatar/stop-recording/` : '/api/avatar/stop-recording',
  
  // Face Recognition
  FACE_RECOGNIZE: USE_DJANGO_BACKEND ? `${DJANGO_BASE_URL}/api/face/recognize/` : '/api/face/recognize',
  FACE_REGISTER: USE_DJANGO_BACKEND ? `${DJANGO_BASE_URL}/api/face/register/` : '/api/face/register',
  FACE_LOGIN: USE_DJANGO_BACKEND ? `${DJANGO_BASE_URL}/api/auth/face-login/` : '/api/auth/face-login',
  
  // Analysis Reports
  FACE_ANALYSIS_REPORT: USE_DJANGO_BACKEND ? `${DJANGO_BASE_URL}/api/face-analysis-report/` : '/api/face-analysis-report',
  HAIR_ANALYSIS_REPORT: USE_DJANGO_BACKEND ? `${DJANGO_BASE_URL}/api/hair-analysis-report/` : '/api/hair-analysis-report',
  SKIN_ANALYSIS: USE_DJANGO_BACKEND ? `${DJANGO_BASE_URL}/api/skin-analysis/` : '/api/skin-analysis',
  
  // Location & Context
  LOCATION_WEATHER: USE_DJANGO_BACKEND ? `${DJANGO_BASE_URL}/api/location-weather/` : '/api/location-weather',
  LANGUAGES: USE_DJANGO_BACKEND ? `${DJANGO_BASE_URL}/api/languages/` : '/api/languages',
  
  // Authentication (using Django for both since it's the auth backend)
  AUTH_LOGIN: USE_DJANGO_BACKEND ? `${DJANGO_BASE_URL}/api/auth/login/` : '/api/auth/login',
  AUTH_SIGNUP: USE_DJANGO_BACKEND ? `${DJANGO_BASE_URL}/api/auth/signup/` : '/api/auth/signup',
  AUTH_ME: USE_DJANGO_BACKEND ? `${DJANGO_BASE_URL}/api/auth/me/` : '/api/auth/me',
  
  // Appointments & Medical
  DOCTORS: USE_DJANGO_BACKEND ? `${DJANGO_BASE_URL}/api/doctors/` : '/api/doctors',
  APPOINTMENTS: USE_DJANGO_BACKEND ? `${DJANGO_BASE_URL}/api/appointments/` : '/api/appointments',
  
  // Consent Management
  CONSENT_RECORD: USE_DJANGO_BACKEND ? `${DJANGO_BASE_URL}/api/consent/record/` : '/api/consent/record',
  CONSENT_REVOKE: USE_DJANGO_BACKEND ? `${DJANGO_BASE_URL}/api/consent/revoke/` : '/api/consent/revoke',
  
  // Other endpoints (keep using Express for now)
  NEARBY_PLACES: '/api/nearby-places',
};

// Helper function to get headers for Django backend
export const getDjangoHeaders = () => {
  if (!USE_DJANGO_BACKEND) return {};
  
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Helper function for API requests
export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const headers = {
    ...getDjangoHeaders(),
    ...options.headers
  };
  
  const response = await fetch(endpoint, {
    ...options,
    headers,
    // Add CORS mode for Django backend
    ...(USE_DJANGO_BACKEND && { mode: 'cors' })
  });
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};