// Application-wide constants

export const APP_NAME = 'MedCor AI';
export const APP_VERSION = '1.0.0';

// API Endpoints
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const DJANGO_API_URL = import.meta.env.VITE_DJANGO_API_URL || 'http://localhost:8002';

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  CHAT: '/chat',
  APPOINTMENTS: '/appointments',
  DOCTORS: '/doctors',
  MEDICAL_RECORDS: '/medical-records',
  SETTINGS: '/settings',
  DASHBOARDS: {
    SUPERADMIN: '/superadmin/dashboard',
    ADMIN: '/admin/dashboard',
    DOCTOR: '/doctor/dashboard',
    PATIENT: '/patient/dashboard',
  },
} as const;

// User Roles
export const USER_ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  PATIENT: 'patient',
  NURSE: 'nurse',
} as const;

// Appointment Status
export const APPOINTMENT_STATUS = {
  SCHEDULED: 'scheduled',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no-show',
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth-token',
  USER_DATA: 'user-data',
  TENANT_ID: 'tenant-id',
  THEME_MODE: 'theme-mode',
  LANGUAGE: 'language',
} as const;

// Time Constants
export const TIME_SLOTS = {
  DURATION: 30, // minutes
  START_HOUR: 9,
  END_HOUR: 17,
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const;