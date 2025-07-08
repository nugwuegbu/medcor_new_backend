// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// API Client
class ApiClient {
  constructor(baseURL = API_BASE_URL) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: { ...this.defaultHeaders, ...options.headers },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return await response.text();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // GET request
  get(endpoint, params = {}) {
    const searchParams = new URLSearchParams(params);
    const queryString = searchParams.toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    
    return this.request(url, { method: 'GET' });
  }

  // POST request
  post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT request
  put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

// Create API instance
export const api = new ApiClient();

// Chat API functions
export const chatApi = {
  sendMessage: (message, sessionId, language = 'en') => 
    api.post('/api/chat', { message, sessionId, language }),
  
  getChatHistory: (sessionId) => 
    api.get('/api/chat/history', { sessionId }),
  
  analyzeImage: (imageBase64, includeLocation = false) =>
    api.post('/api/analyze-user-image', { 
      image: imageBase64, 
      includeLocation 
    }),
};

// Doctors API functions
export const doctorsApi = {
  getAllDoctors: () => api.get('/api/doctors'),
  
  getDoctor: (id) => api.get(`/api/doctors/${id}`),
  
  searchDoctors: (query, filters = {}) => 
    api.get('/api/doctors/search', { query, ...filters }),
};

// Appointments API functions
export const appointmentsApi = {
  createAppointment: (appointmentData) => 
    api.post('/api/appointments', appointmentData),
  
  getAppointments: (patientId) => 
    api.get('/api/appointments', { patientId }),
  
  updateAppointment: (id, updates) => 
    api.put(`/api/appointments/${id}`, updates),
  
  cancelAppointment: (id) => 
    api.delete(`/api/appointments/${id}`),
  
  checkAvailability: (doctorId, date) =>
    api.get('/api/appointments/availability', { doctorId, date }),
};

// Location and Weather API
export const locationApi = {
  getLocationWeather: (latitude, longitude) =>
    api.post('/api/location-weather', { latitude, longitude }),
  
  searchNearbyPlaces: (latitude, longitude, type = 'hospital', radius = 5000) =>
    api.post('/api/nearby-places', { latitude, longitude, type, radius }),
};

// Text-to-Speech API
export const ttsApi = {
  synthesizeText: (text, voice = 'default', language = 'en') =>
    api.post('/api/tts', { text, voice, language }, {
      headers: { 'Accept': 'audio/mpeg' }
    }),
  
  getAvailableVoices: () => api.get('/api/voices'),
};

// Authentication API (if needed)
export const authApi = {
  faceLogin: (imageBase64, sessionId) =>
    api.post('/api/auth/face-login', { imageBase64, sessionId }),
  
  registerFace: (imageBase64) =>
    api.post('/api/auth/register-face', { imageBase64 }),
  
  updatePhone: (phoneNumber) =>
    api.post('/api/auth/update-phone', { phoneNumber }),
  
  getCurrentUser: () => api.get('/api/auth/user'),
  
  logout: () => api.post('/api/auth/logout'),
};

// Utility functions
export const apiUtils = {
  // Handle file uploads
  uploadFile: async (file, endpoint = '/api/upload') => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }
    
    return await response.json();
  },

  // Convert file to base64
  fileToBase64: (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  // Format API errors for display
  formatError: (error) => {
    if (error.message) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'An unexpected error occurred';
  },

  // Retry failed requests
  retryRequest: async (requestFn, maxRetries = 3, delay = 1000) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  },
};

// Export default API client
export default api;