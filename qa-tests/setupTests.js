/**
 * Test Setup File for MedCor Healthcare Platform
 * Configures the test environment before running tests
 */

// Import testing libraries
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import fetch from 'node-fetch';

// Polyfills for Node.js environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
global.fetch = fetch;

// Mock window object
global.window = {
  location: {
    href: 'http://localhost:5000',
    origin: 'http://localhost:5000',
    pathname: '/',
    search: '',
    hash: ''
  },
  localStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
  },
  sessionStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
  },
  matchMedia: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  }))
};

// Mock navigator
global.navigator = {
  userAgent: 'Mozilla/5.0 (Testing) Chrome/999.0',
  language: 'en-US',
  languages: ['en-US', 'en'],
  onLine: true,
  mediaDevices: {
    getUserMedia: jest.fn().mockImplementation(() =>
      Promise.resolve({
        getTracks: () => [],
        getVideoTracks: () => [],
        getAudioTracks: () => [],
        active: true
      })
    ),
    enumerateDevices: jest.fn().mockResolvedValue([
      { kind: 'videoinput', deviceId: 'camera1', label: 'Test Camera' },
      { kind: 'audioinput', deviceId: 'mic1', label: 'Test Microphone' }
    ])
  },
  permissions: {
    query: jest.fn().mockResolvedValue({ state: 'granted' })
  }
};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() { return null; }
  unobserve() { return null; }
  disconnect() { return null; }
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() { return null; }
  unobserve() { return null; }
  disconnect() { return null; }
};

// Mock WebSocket
global.WebSocket = class WebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = WebSocket.OPEN;
    setTimeout(() => {
      if (this.onopen) this.onopen();
    }, 0);
  }
  
  send(data) {
    if (this.onmessage) {
      setTimeout(() => {
        this.onmessage({
          data: JSON.stringify({
            type: 'test_response',
            payload: { echo: data }
          })
        });
      }, 0);
    }
  }
  
  close() {
    this.readyState = WebSocket.CLOSED;
    if (this.onclose) this.onclose();
  }
  
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
};

// Mock canvas for image processing
HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue({
  drawImage: jest.fn(),
  getImageData: jest.fn().mockReturnValue({
    data: new Uint8ClampedArray(4),
    width: 1,
    height: 1
  }),
  putImageData: jest.fn(),
  createImageData: jest.fn(),
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  strokeRect: jest.fn(),
  fillText: jest.fn(),
  strokeText: jest.fn(),
  measureText: jest.fn().mockReturnValue({ width: 0 }),
  beginPath: jest.fn(),
  closePath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  arc: jest.fn(),
  rect: jest.fn(),
  fill: jest.fn(),
  stroke: jest.fn(),
  clip: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  translate: jest.fn(),
  rotate: jest.fn(),
  scale: jest.fn(),
  transform: jest.fn(),
  setTransform: jest.fn()
});

HTMLCanvasElement.prototype.toDataURL = jest.fn().mockReturnValue('data:image/png;base64,test');
HTMLCanvasElement.prototype.toBlob = jest.fn().mockImplementation((callback) => {
  callback(new Blob(['test'], { type: 'image/png' }));
});

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn().mockReturnValue('blob:http://localhost/test');
global.URL.revokeObjectURL = jest.fn();

// Mock environment variables
process.env = {
  ...process.env,
  NODE_ENV: 'test',
  VITE_API_URL: 'http://localhost:8000/api',
  VITE_HEYGEN_API_KEY: 'test-heygen-key',
  VITE_OPENAI_API_KEY: 'test-openai-key',
  VITE_STRIPE_PUBLISHABLE_KEY: 'pk_test_123'
};

// Configure console to suppress noise during tests
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  // Suppress specific console errors/warnings during tests
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Not implemented') ||
       args[0].includes('ReactDOM.render') ||
       args[0].includes('Warning:'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
  
  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('componentWillReceiveProps') ||
       args[0].includes('componentWillMount'))
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Global test utilities
global.sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

global.waitForElement = async (callback, options = {}) => {
  const { timeout = 5000, interval = 100 } = options;
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    try {
      const result = callback();
      if (result) return result;
    } catch (e) {
      // Continue waiting
    }
    await global.sleep(interval);
  }
  
  throw new Error('Timeout waiting for element');
};

// Mock API responses
global.mockApiResponse = (endpoint, response, status = 200) => {
  global.fetch = jest.fn().mockImplementation((url) => {
    if (url.includes(endpoint)) {
      return Promise.resolve({
        ok: status >= 200 && status < 300,
        status,
        json: () => Promise.resolve(response),
        text: () => Promise.resolve(JSON.stringify(response)),
        headers: new Headers({ 'content-type': 'application/json' })
      });
    }
    return Promise.reject(new Error('Not found'));
  });
};

// Test data factories
global.createTestUser = (overrides = {}) => ({
  id: '123',
  email: 'test@medcor.ai',
  firstName: 'Test',
  lastName: 'User',
  role: 'patient',
  createdAt: new Date().toISOString(),
  ...overrides
});

global.createTestAppointment = (overrides = {}) => ({
  id: '456',
  patientId: '123',
  doctorId: '789',
  date: new Date().toISOString(),
  time: '10:00',
  status: 'scheduled',
  reason: 'Regular checkup',
  ...overrides
});

global.createTestMedicalRecord = (overrides = {}) => ({
  id: '789',
  patientId: '123',
  doctorId: '456',
  type: 'consultation',
  date: new Date().toISOString(),
  diagnosis: 'Common cold',
  prescription: 'Rest and fluids',
  ...overrides
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});

// Export for use in other test files
export {
  global
};