// API Configuration for Django Backend
export const API_CONFIG = {
  // Use production medcor.ai domain for API calls
  BASE_URL: 'https://medcor.ai',
  
  // API endpoints matching Django URL patterns
  ENDPOINTS: {
    // Authentication
    LOGIN: '/api/auth/login/',
    LOGOUT: '/api/auth/logout/', 
    ME: '/api/auth/profile/',  // Django uses 'profile' not 'me'
    
    // Appointments
    APPOINTMENTS: '/api/appointments/appointments/',
    APPOINTMENTS_TODAY: '/api/appointments/appointments/today/',
    
    // Treatments
    TREATMENTS: '/api/treatments/treatments/',
    
    // Tenants/Users
    USERS: '/api/auth/users/',  // Django user endpoint
    
    // Health check
    HEALTH: '/api/health/'
  }
};

// Helper to get full URL
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};