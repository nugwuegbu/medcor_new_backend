/**
 * API Integration Tests for MedCor Healthcare Platform
 * Testing API endpoints and data flow between frontend and backend
 */

import axios, { AxiosInstance } from 'axios';
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';

// Configuration
const API_BASE_URL = process.env.API_URL || 'http://localhost:8000/api';
const TEST_TIMEOUT = 30000;

// Test data
const testPatient = {
  email: 'test.patient@medcor.ai',
  password: 'TestPass123!',
  firstName: 'Test',
  lastName: 'Patient',
  role: 'patient'
};

const testDoctor = {
  email: 'test.doctor@medcor.ai',
  password: 'DoctorPass123!',
  firstName: 'Test',
  lastName: 'Doctor',
  role: 'doctor',
  specialty: 'General Practice',
  licenseNumber: 'MD12345'
};

// API Client setup
class APIClient {
  private client: AxiosInstance;
  private authToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        if (this.authToken) {
          config.headers.Authorization = `Bearer ${this.authToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.authToken = null;
        }
        return Promise.reject(error);
      }
    );
  }

  setAuthToken(token: string) {
    this.authToken = token;
  }

  async post(url: string, data?: any) {
    return this.client.post(url, data);
  }

  async get(url: string, params?: any) {
    return this.client.get(url, { params });
  }

  async put(url: string, data?: any) {
    return this.client.put(url, data);
  }

  async patch(url: string, data?: any) {
    return this.client.patch(url, data);
  }

  async delete(url: string) {
    return this.client.delete(url);
  }
}

// Test Suites
describe('Authentication Flow Integration', () => {
  let apiClient: APIClient;
  let userId: string;
  let refreshToken: string;

  beforeAll(() => {
    apiClient = new APIClient();
  });

  test('User registration flow', async () => {
    const registrationData = {
      ...testPatient,
      passwordConfirm: testPatient.password,
      dateOfBirth: '1990-01-01',
      phone: '+1234567890'
    };

    const response = await apiClient.post('/auth/register', registrationData);
    
    expect(response.status).toBe(201);
    expect(response.data).toHaveProperty('user');
    expect(response.data).toHaveProperty('accessToken');
    expect(response.data).toHaveProperty('refreshToken');
    
    userId = response.data.user.id;
    apiClient.setAuthToken(response.data.accessToken);
    refreshToken = response.data.refreshToken;
  }, TEST_TIMEOUT);

  test('User login flow', async () => {
    const loginData = {
      email: testPatient.email,
      password: testPatient.password
    };

    const response = await apiClient.post('/auth/login', loginData);
    
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('accessToken');
    expect(response.data).toHaveProperty('user');
    expect(response.data.user.email).toBe(testPatient.email);
    
    apiClient.setAuthToken(response.data.accessToken);
  });

  test('Token refresh flow', async () => {
    const response = await apiClient.post('/auth/refresh', {
      refreshToken: refreshToken
    });
    
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('accessToken');
    expect(response.data).toHaveProperty('refreshToken');
    
    apiClient.setAuthToken(response.data.accessToken);
  });

  test('Protected endpoint access', async () => {
    const response = await apiClient.get('/user/profile');
    
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('email');
    expect(response.data.email).toBe(testPatient.email);
  });

  test('Logout flow', async () => {
    const response = await apiClient.post('/auth/logout');
    
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('message');
    
    // Verify token is invalidated
    apiClient.setAuthToken('');
    await expect(apiClient.get('/user/profile')).rejects.toThrow();
  });
});

describe('Appointment Booking Integration', () => {
  let apiClient: APIClient;
  let patientToken: string;
  let doctorId: string;
  let appointmentId: string;

  beforeAll(async () => {
    apiClient = new APIClient();
    
    // Login as patient
    const loginResponse = await apiClient.post('/auth/login', {
      email: testPatient.email,
      password: testPatient.password
    });
    
    patientToken = loginResponse.data.accessToken;
    apiClient.setAuthToken(patientToken);
    
    // Get a doctor
    const doctorsResponse = await apiClient.get('/doctors');
    doctorId = doctorsResponse.data[0]?.id;
  });

  test('Search available doctors', async () => {
    const response = await apiClient.get('/doctors', {
      specialty: 'Cardiology',
      available: true
    });
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.data)).toBe(true);
    
    if (response.data.length > 0) {
      const doctor = response.data[0];
      expect(doctor).toHaveProperty('id');
      expect(doctor).toHaveProperty('name');
      expect(doctor).toHaveProperty('specialty');
      expect(doctor).toHaveProperty('availability');
    }
  });

  test('Check doctor availability', async () => {
    const date = new Date();
    date.setDate(date.getDate() + 7); // Next week
    
    const response = await apiClient.get(`/doctors/${doctorId}/availability`, {
      date: date.toISOString().split('T')[0]
    });
    
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('availableSlots');
    expect(Array.isArray(response.data.availableSlots)).toBe(true);
  });

  test('Book appointment', async () => {
    const appointmentDate = new Date();
    appointmentDate.setDate(appointmentDate.getDate() + 7);
    
    const appointmentData = {
      doctorId: doctorId,
      date: appointmentDate.toISOString().split('T')[0],
      time: '10:00',
      type: 'consultation',
      reason: 'Regular checkup',
      symptoms: 'None',
      duration: 30
    };
    
    const response = await apiClient.post('/appointments', appointmentData);
    
    expect(response.status).toBe(201);
    expect(response.data).toHaveProperty('id');
    expect(response.data).toHaveProperty('status');
    expect(response.data.status).toBe('scheduled');
    
    appointmentId = response.data.id;
  });

  test('Get appointment details', async () => {
    const response = await apiClient.get(`/appointments/${appointmentId}`);
    
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('id');
    expect(response.data.id).toBe(appointmentId);
    expect(response.data).toHaveProperty('patient');
    expect(response.data).toHaveProperty('doctor');
    expect(response.data).toHaveProperty('status');
  });

  test('Reschedule appointment', async () => {
    const newDate = new Date();
    newDate.setDate(newDate.getDate() + 10);
    
    const rescheduleData = {
      date: newDate.toISOString().split('T')[0],
      time: '14:00'
    };
    
    const response = await apiClient.patch(
      `/appointments/${appointmentId}/reschedule`,
      rescheduleData
    );
    
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('date');
    expect(response.data).toHaveProperty('time');
    expect(response.data.time).toBe('14:00');
  });

  test('Cancel appointment', async () => {
    const response = await apiClient.patch(
      `/appointments/${appointmentId}/cancel`,
      { reason: 'Schedule conflict' }
    );
    
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('status');
    expect(response.data.status).toBe('cancelled');
  });
});

describe('Medical Records Integration', () => {
  let apiClient: APIClient;
  let recordId: string;

  beforeAll(async () => {
    apiClient = new APIClient();
    
    // Login as doctor
    const loginResponse = await apiClient.post('/auth/login', {
      email: testDoctor.email,
      password: testDoctor.password
    });
    
    apiClient.setAuthToken(loginResponse.data.accessToken);
  });

  test('Create medical record', async () => {
    const recordData = {
      patientId: 'patient-123',
      type: 'consultation',
      date: new Date().toISOString(),
      chiefComplaint: 'Headache',
      symptoms: ['Headache', 'Nausea'],
      vitalSigns: {
        bloodPressure: '120/80',
        pulse: 72,
        temperature: 98.6,
        weight: 150
      },
      diagnosis: 'Migraine',
      treatment: 'Rest and medication',
      prescription: [
        {
          medication: 'Ibuprofen',
          dosage: '400mg',
          frequency: 'Twice daily',
          duration: '7 days'
        }
      ],
      notes: 'Patient advised to follow up if symptoms persist'
    };
    
    const response = await apiClient.post('/medical-records', recordData);
    
    expect(response.status).toBe(201);
    expect(response.data).toHaveProperty('id');
    expect(response.data).toHaveProperty('diagnosis');
    expect(response.data.diagnosis).toBe('Migraine');
    
    recordId = response.data.id;
  });

  test('Update medical record', async () => {
    const updateData = {
      followUpNotes: 'Patient responded well to treatment',
      status: 'resolved'
    };
    
    const response = await apiClient.patch(
      `/medical-records/${recordId}`,
      updateData
    );
    
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('followUpNotes');
    expect(response.data).toHaveProperty('status');
    expect(response.data.status).toBe('resolved');
  });

  test('Get patient medical history', async () => {
    const response = await apiClient.get('/medical-records', {
      patientId: 'patient-123',
      limit: 10,
      sort: 'date:desc'
    });
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.data)).toBe(true);
    
    if (response.data.length > 0) {
      const record = response.data[0];
      expect(record).toHaveProperty('id');
      expect(record).toHaveProperty('type');
      expect(record).toHaveProperty('date');
      expect(record).toHaveProperty('diagnosis');
    }
  });

  test('Upload medical document', async () => {
    const FormData = require('form-data');
    const fs = require('fs');
    
    const form = new FormData();
    form.append('recordId', recordId);
    form.append('documentType', 'lab-report');
    form.append('file', fs.createReadStream('./test-files/lab-report.pdf'));
    
    const response = await apiClient.post('/medical-records/upload', form, {
      headers: form.getHeaders()
    });
    
    expect(response.status).toBe(201);
    expect(response.data).toHaveProperty('documentId');
    expect(response.data).toHaveProperty('url');
  });
});

describe('Chat and AI Integration', () => {
  let apiClient: APIClient;
  let conversationId: string;

  beforeAll(async () => {
    apiClient = new APIClient();
    
    // Login as patient
    const loginResponse = await apiClient.post('/auth/login', {
      email: testPatient.email,
      password: testPatient.password
    });
    
    apiClient.setAuthToken(loginResponse.data.accessToken);
  });

  test('Start AI chat session', async () => {
    const response = await apiClient.post('/chat/ai/start', {
      context: 'health_consultation'
    });
    
    expect(response.status).toBe(201);
    expect(response.data).toHaveProperty('conversationId');
    expect(response.data).toHaveProperty('sessionToken');
    
    conversationId = response.data.conversationId;
  });

  test('Send message to AI assistant', async () => {
    const messageData = {
      conversationId: conversationId,
      message: 'I have been experiencing headaches for the past week',
      context: {
        symptoms: ['headache'],
        duration: '1 week'
      }
    };
    
    const response = await apiClient.post('/chat/ai/message', messageData);
    
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('response');
    expect(response.data).toHaveProperty('suggestions');
    expect(response.data.response).toBeTruthy();
  });

  test('Get AI health recommendations', async () => {
    const response = await apiClient.post('/chat/ai/recommendations', {
      symptoms: ['headache', 'fatigue'],
      medicalHistory: ['hypertension'],
      medications: ['lisinopril']
    });
    
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('recommendations');
    expect(Array.isArray(response.data.recommendations)).toBe(true);
    expect(response.data).toHaveProperty('urgencyLevel');
  });

  test('Send message to doctor', async () => {
    const messageData = {
      recipientId: 'doctor-123',
      subject: 'Question about prescription',
      message: 'Can I take this medication with food?',
      priority: 'normal'
    };
    
    const response = await apiClient.post('/chat/messages', messageData);
    
    expect(response.status).toBe(201);
    expect(response.data).toHaveProperty('id');
    expect(response.data).toHaveProperty('status');
    expect(response.data.status).toBe('sent');
  });

  test('Get conversation history', async () => {
    const response = await apiClient.get('/chat/conversations', {
      limit: 20,
      includeArchived: false
    });
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.data)).toBe(true);
    
    if (response.data.length > 0) {
      const conversation = response.data[0];
      expect(conversation).toHaveProperty('id');
      expect(conversation).toHaveProperty('participants');
      expect(conversation).toHaveProperty('lastMessage');
      expect(conversation).toHaveProperty('unreadCount');
    }
  });
});

describe('Payment and Subscription Integration', () => {
  let apiClient: APIClient;
  let subscriptionId: string;
  let paymentMethodId: string;

  beforeAll(async () => {
    apiClient = new APIClient();
    
    // Login as patient
    const loginResponse = await apiClient.post('/auth/login', {
      email: testPatient.email,
      password: testPatient.password
    });
    
    apiClient.setAuthToken(loginResponse.data.accessToken);
  });

  test('Get subscription plans', async () => {
    const response = await apiClient.get('/subscriptions/plans');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.data)).toBe(true);
    
    const plans = response.data;
    expect(plans.length).toBeGreaterThan(0);
    
    const plan = plans[0];
    expect(plan).toHaveProperty('id');
    expect(plan).toHaveProperty('name');
    expect(plan).toHaveProperty('price');
    expect(plan).toHaveProperty('features');
    expect(plan).toHaveProperty('billingPeriod');
  });

  test('Add payment method', async () => {
    const paymentData = {
      type: 'card',
      token: 'tok_visa', // Stripe test token
      billingDetails: {
        name: 'Test Patient',
        email: testPatient.email,
        address: {
          line1: '123 Test Street',
          city: 'Test City',
          state: 'TS',
          postalCode: '12345',
          country: 'US'
        }
      }
    };
    
    const response = await apiClient.post('/payments/methods', paymentData);
    
    expect(response.status).toBe(201);
    expect(response.data).toHaveProperty('id');
    expect(response.data).toHaveProperty('last4');
    expect(response.data).toHaveProperty('brand');
    
    paymentMethodId = response.data.id;
  });

  test('Create subscription', async () => {
    const subscriptionData = {
      planId: 'premium-monthly',
      paymentMethodId: paymentMethodId,
      promoCode: 'TESTPROMO'
    };
    
    const response = await apiClient.post('/subscriptions', subscriptionData);
    
    expect(response.status).toBe(201);
    expect(response.data).toHaveProperty('id');
    expect(response.data).toHaveProperty('status');
    expect(response.data).toHaveProperty('currentPeriodEnd');
    expect(response.data.status).toBe('active');
    
    subscriptionId = response.data.id;
  });

  test('Get subscription details', async () => {
    const response = await apiClient.get(`/subscriptions/${subscriptionId}`);
    
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('id');
    expect(response.data).toHaveProperty('plan');
    expect(response.data).toHaveProperty('status');
    expect(response.data).toHaveProperty('nextBillingDate');
  });

  test('Get payment history', async () => {
    const response = await apiClient.get('/payments/history', {
      limit: 10,
      startDate: '2024-01-01',
      endDate: '2024-12-31'
    });
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.data)).toBe(true);
    
    if (response.data.length > 0) {
      const payment = response.data[0];
      expect(payment).toHaveProperty('id');
      expect(payment).toHaveProperty('amount');
      expect(payment).toHaveProperty('status');
      expect(payment).toHaveProperty('date');
      expect(payment).toHaveProperty('description');
    }
  });

  test('Cancel subscription', async () => {
    const response = await apiClient.patch(
      `/subscriptions/${subscriptionId}/cancel`,
      {
        reason: 'Testing cancellation',
        feedback: 'Just testing the cancellation flow'
      }
    );
    
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('status');
    expect(response.data.status).toBe('cancelled');
    expect(response.data).toHaveProperty('cancelledAt');
  });
});

describe('Multi-tenant Integration', () => {
  let apiClient: APIClient;
  let tenantDomain: string;

  beforeAll(() => {
    apiClient = new APIClient();
    tenantDomain = 'hospital1.medcor.ai';
  });

  test('Access tenant-specific endpoint', async () => {
    // Set tenant header
    apiClient.client.defaults.headers.common['X-Tenant-Domain'] = tenantDomain;
    
    const response = await apiClient.get('/tenant/info');
    
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('name');
    expect(response.data).toHaveProperty('domain');
    expect(response.data).toHaveProperty('settings');
    expect(response.data.domain).toBe(tenantDomain);
  });

  test('Tenant data isolation', async () => {
    // Login to first tenant
    apiClient.client.defaults.headers.common['X-Tenant-Domain'] = 'hospital1.medcor.ai';
    
    const login1 = await apiClient.post('/auth/login', {
      email: 'user@hospital1.com',
      password: 'Password123!'
    });
    
    const token1 = login1.data.accessToken;
    
    // Try to access second tenant with first tenant's token
    apiClient.client.defaults.headers.common['X-Tenant-Domain'] = 'hospital2.medcor.ai';
    apiClient.setAuthToken(token1);
    
    await expect(apiClient.get('/user/profile')).rejects.toThrow();
  });
});

describe('WebSocket Real-time Integration', () => {
  let wsClient: WebSocket;
  let apiClient: APIClient;
  let authToken: string;

  beforeAll(async () => {
    apiClient = new APIClient();
    
    // Login to get auth token
    const loginResponse = await apiClient.post('/auth/login', {
      email: testPatient.email,
      password: testPatient.password
    });
    
    authToken = loginResponse.data.accessToken;
  });

  test('Connect to WebSocket server', (done) => {
    wsClient = new WebSocket(`ws://localhost:8000/ws?token=${authToken}`);
    
    wsClient.onopen = () => {
      expect(wsClient.readyState).toBe(WebSocket.OPEN);
      done();
    };
    
    wsClient.onerror = (error) => {
      done(error);
    };
  });

  test('Receive real-time notifications', (done) => {
    wsClient.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      expect(data).toHaveProperty('type');
      expect(data).toHaveProperty('payload');
      
      if (data.type === 'notification') {
        expect(data.payload).toHaveProperty('title');
        expect(data.payload).toHaveProperty('message');
        done();
      }
    };
    
    // Trigger a notification through API
    apiClient.post('/test/trigger-notification', {
      userId: 'current',
      message: 'Test notification'
    });
  });

  test('Send and receive chat messages', (done) => {
    const testMessage = {
      type: 'chat_message',
      payload: {
        recipientId: 'doctor-123',
        message: 'Test real-time message'
      }
    };
    
    wsClient.send(JSON.stringify(testMessage));
    
    wsClient.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'message_sent_confirmation') {
        expect(data.payload).toHaveProperty('messageId');
        expect(data.payload).toHaveProperty('timestamp');
        done();
      }
    };
  });

  afterAll(() => {
    if (wsClient && wsClient.readyState === WebSocket.OPEN) {
      wsClient.close();
    }
  });
});

export default {};