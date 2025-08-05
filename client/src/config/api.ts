// API Configuration for Django Backend
export const API_CONFIG = {
  // Use Django backend directly - always use Replit domain since Django is multi-tenant
  BASE_URL: 'https://14b294fa-eeaf-46d5-a262-7c25b42c30d9-00-m9ex3vzr6khq.sisko.replit.dev:8000',
  
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