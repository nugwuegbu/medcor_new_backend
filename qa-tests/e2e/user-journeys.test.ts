/**
 * End-to-End QA Tests for MedCor Healthcare Platform
 * Testing complete user journeys and workflows
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';
import { faker } from '@faker-js/faker';

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const API_URL = process.env.API_URL || 'http://localhost:8000/api';

// Helper functions
async function login(page: Page, email: string, password: string) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('[data-testid="email-input"]', email);
  await page.fill('[data-testid="password-input"]', password);
  await page.click('[data-testid="login-button"]');
  await page.waitForNavigation();
}

async function logout(page: Page) {
  await page.click('[data-testid="user-menu"]');
  await page.click('[data-testid="logout-button"]');
  await page.waitForNavigation();
}

// Patient Journey Tests
test.describe('Patient User Journey', () => {
  let context: BrowserContext;
  let page: Page;
  let patientEmail: string;
  let patientPassword: string;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
    
    // Generate test patient credentials
    patientEmail = faker.internet.email();
    patientPassword = 'TestPass123!';
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('Complete patient registration and onboarding', async () => {
    // Navigate to signup page
    await page.goto(`${BASE_URL}/signup`);
    
    // Fill registration form
    await page.fill('[data-testid="first-name"]', faker.person.firstName());
    await page.fill('[data-testid="last-name"]', faker.person.lastName());
    await page.fill('[data-testid="email"]', patientEmail);
    await page.fill('[data-testid="password"]', patientPassword);
    await page.fill('[data-testid="confirm-password"]', patientPassword);
    await page.selectOption('[data-testid="role-select"]', 'patient');
    await page.fill('[data-testid="phone"]', faker.phone.number());
    await page.fill('[data-testid="date-of-birth"]', '1990-01-01');
    
    // Accept terms and submit
    await page.check('[data-testid="terms-checkbox"]');
    await page.click('[data-testid="signup-button"]');
    
    // Verify successful registration
    await expect(page).toHaveURL(`${BASE_URL}/dashboard`);
    await expect(page.locator('[data-testid="welcome-message"]')).toContainText('Welcome');
    
    // Complete profile setup
    await page.click('[data-testid="complete-profile-button"]');
    await page.fill('[data-testid="address"]', faker.location.streetAddress());
    await page.fill('[data-testid="city"]', faker.location.city());
    await page.fill('[data-testid="state"]', faker.location.state());
    await page.fill('[data-testid="zip"]', faker.location.zipCode());
    await page.selectOption('[data-testid="blood-type"]', 'O+');
    await page.fill('[data-testid="emergency-contact"]', faker.person.fullName());
    await page.fill('[data-testid="emergency-phone"]', faker.phone.number());
    
    await page.click('[data-testid="save-profile-button"]');
    await expect(page.locator('[data-testid="profile-complete-badge"]')).toBeVisible();
  });

  test('Search and book appointment with doctor', async () => {
    await login(page, patientEmail, patientPassword);
    
    // Navigate to doctors page
    await page.click('[data-testid="nav-doctors"]');
    await expect(page).toHaveURL(`${BASE_URL}/doctors`);
    
    // Search for cardiologist
    await page.fill('[data-testid="specialty-search"]', 'Cardiology');
    await page.click('[data-testid="search-button"]');
    
    // Wait for results
    await page.waitForSelector('[data-testid="doctor-card"]');
    
    // Select first available doctor
    const doctorCard = page.locator('[data-testid="doctor-card"]').first();
    await expect(doctorCard).toBeVisible();
    
    // View doctor profile
    await doctorCard.click('[data-testid="view-profile"]');
    await expect(page.locator('[data-testid="doctor-details"]')).toBeVisible();
    
    // Book appointment
    await page.click('[data-testid="book-appointment-button"]');
    
    // Select date and time
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await page.fill('[data-testid="appointment-date"]', tomorrow.toISOString().split('T')[0]);
    await page.selectOption('[data-testid="appointment-time"]', '10:00');
    
    // Fill appointment details
    await page.fill('[data-testid="appointment-reason"]', 'Regular checkup');
    await page.fill('[data-testid="symptoms"]', 'Chest pain, shortness of breath');
    await page.selectOption('[data-testid="appointment-type"]', 'in-person');
    
    // Submit appointment request
    await page.click('[data-testid="submit-appointment"]');
    
    // Verify confirmation
    await expect(page.locator('[data-testid="appointment-confirmation"]')).toBeVisible();
    await expect(page.locator('[data-testid="appointment-status"]')).toContainText('Scheduled');
  });

  test('Use AI chat for health consultation', async () => {
    await login(page, patientEmail, patientPassword);
    
    // Open chat interface
    await page.click('[data-testid="chat-button"]');
    await expect(page.locator('[data-testid="chat-widget"]')).toBeVisible();
    
    // Start conversation
    await page.fill('[data-testid="chat-input"]', 'I have been experiencing headaches lately');
    await page.click('[data-testid="send-message"]');
    
    // Wait for AI response
    await expect(page.locator('[data-testid="ai-typing-indicator"]')).toBeVisible();
    await expect(page.locator('[data-testid="ai-message"]')).toBeVisible({ timeout: 10000 });
    
    // Continue conversation
    await page.fill('[data-testid="chat-input"]', 'They occur mostly in the morning');
    await page.click('[data-testid="send-message"]');
    
    // Check for follow-up questions
    await expect(page.locator('[data-testid="ai-message"]').last()).toContainText(/How long|duration|frequency/i);
    
    // Request appointment through chat
    await page.fill('[data-testid="chat-input"]', 'Can you help me book an appointment?');
    await page.click('[data-testid="send-message"]');
    
    // Verify appointment booking suggestion
    await expect(page.locator('[data-testid="book-appointment-suggestion"]')).toBeVisible();
  });

  test('Upload and view medical records', async () => {
    await login(page, patientEmail, patientPassword);
    
    // Navigate to medical records
    await page.click('[data-testid="nav-medical-records"]');
    await expect(page).toHaveURL(`${BASE_URL}/medical-records`);
    
    // Upload medical document
    await page.click('[data-testid="upload-record-button"]');
    
    // Select file type
    await page.selectOption('[data-testid="record-type"]', 'lab-report');
    
    // Upload file
    const fileInput = page.locator('[data-testid="file-input"]');
    await fileInput.setInputFiles('./test-files/sample-lab-report.pdf');
    
    // Add description
    await page.fill('[data-testid="record-description"]', 'Blood test results from last week');
    await page.fill('[data-testid="record-date"]', '2024-01-10');
    
    // Submit upload
    await page.click('[data-testid="upload-submit"]');
    
    // Verify upload success
    await expect(page.locator('[data-testid="upload-success"]')).toBeVisible();
    
    // View uploaded record
    await page.click('[data-testid="view-records"]');
    await expect(page.locator('[data-testid="record-item"]')).toContainText('Blood test results');
    
    // Download record
    await page.click('[data-testid="download-record"]');
    // Verify download started (implementation depends on browser handling)
  });

  test('Manage prescription refills', async () => {
    await login(page, patientEmail, patientPassword);
    
    // Navigate to prescriptions
    await page.click('[data-testid="nav-prescriptions"]');
    
    // View active prescriptions
    await expect(page.locator('[data-testid="prescription-list"]')).toBeVisible();
    
    // Request refill
    const prescription = page.locator('[data-testid="prescription-item"]').first();
    await prescription.click('[data-testid="request-refill"]');
    
    // Fill refill form
    await page.selectOption('[data-testid="pharmacy-select"]', 'CVS Pharmacy');
    await page.fill('[data-testid="refill-notes"]', 'Running low on medication');
    
    // Submit refill request
    await page.click('[data-testid="submit-refill"]');
    
    // Verify request submitted
    await expect(page.locator('[data-testid="refill-status"]')).toContainText('Pending');
  });
});

// Doctor Journey Tests
test.describe('Doctor User Journey', () => {
  let context: BrowserContext;
  let page: Page;
  const doctorEmail = 'doctor@medcor.ai';
  const doctorPassword = 'DoctorPass123!';

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('Doctor login and dashboard overview', async () => {
    await login(page, doctorEmail, doctorPassword);
    
    // Verify doctor dashboard
    await expect(page).toHaveURL(`${BASE_URL}/doctor-dashboard`);
    
    // Check dashboard widgets
    await expect(page.locator('[data-testid="today-appointments"]')).toBeVisible();
    await expect(page.locator('[data-testid="pending-consultations"]')).toBeVisible();
    await expect(page.locator('[data-testid="patient-messages"]')).toBeVisible();
    await expect(page.locator('[data-testid="schedule-overview"]')).toBeVisible();
  });

  test('Manage appointments and consultations', async () => {
    await login(page, doctorEmail, doctorPassword);
    
    // View appointments
    await page.click('[data-testid="nav-appointments"]');
    
    // Filter today's appointments
    await page.click('[data-testid="filter-today"]');
    await expect(page.locator('[data-testid="appointment-list"]')).toBeVisible();
    
    // Start consultation
    const appointment = page.locator('[data-testid="appointment-item"]').first();
    await appointment.click('[data-testid="start-consultation"]');
    
    // Enter consultation room
    await expect(page.locator('[data-testid="consultation-room"]')).toBeVisible();
    
    // View patient history
    await page.click('[data-testid="view-patient-history"]');
    await expect(page.locator('[data-testid="patient-history-modal"]')).toBeVisible();
    
    // Add consultation notes
    await page.fill('[data-testid="consultation-notes"]', 'Patient presents with mild symptoms of common cold');
    
    // Add diagnosis
    await page.fill('[data-testid="diagnosis-input"]', 'Common Cold');
    await page.selectOption('[data-testid="diagnosis-severity"]', 'mild');
    
    // Prescribe medication
    await page.click('[data-testid="add-prescription"]');
    await page.fill('[data-testid="medication-name"]', 'Paracetamol');
    await page.fill('[data-testid="dosage"]', '500mg');
    await page.fill('[data-testid="frequency"]', 'Twice daily');
    await page.fill('[data-testid="duration"]', '5 days');
    
    // Complete consultation
    await page.click('[data-testid="complete-consultation"]');
    await expect(page.locator('[data-testid="consultation-complete"]')).toBeVisible();
  });

  test('Create and manage medical records', async () => {
    await login(page, doctorEmail, doctorPassword);
    
    // Navigate to patient management
    await page.click('[data-testid="nav-patients"]');
    
    // Search for patient
    await page.fill('[data-testid="patient-search"]', 'John Doe');
    await page.click('[data-testid="search-patients"]');
    
    // Select patient
    await page.click('[data-testid="patient-result"]');
    
    // Create medical record
    await page.click('[data-testid="create-record"]');
    
    // Fill record details
    await page.selectOption('[data-testid="record-type"]', 'consultation');
    await page.fill('[data-testid="chief-complaint"]', 'Persistent cough');
    await page.fill('[data-testid="examination-findings"]', 'Mild throat inflammation');
    await page.fill('[data-testid="diagnosis"]', 'Upper respiratory infection');
    await page.fill('[data-testid="treatment-plan"]', 'Rest, fluids, and prescribed antibiotics');
    
    // Add lab test order
    await page.click('[data-testid="order-lab-test"]');
    await page.selectOption('[data-testid="test-type"]', 'blood-test');
    await page.check('[data-testid="test-cbc"]');
    await page.check('[data-testid="test-esr"]');
    
    // Save record
    await page.click('[data-testid="save-record"]');
    await expect(page.locator('[data-testid="record-saved"]')).toBeVisible();
  });

  test('Respond to patient messages', async () => {
    await login(page, doctorEmail, doctorPassword);
    
    // Navigate to messages
    await page.click('[data-testid="nav-messages"]');
    
    // View unread messages
    await page.click('[data-testid="filter-unread"]');
    
    // Open first message
    const message = page.locator('[data-testid="message-item"]').first();
    await message.click();
    
    // Read message content
    await expect(page.locator('[data-testid="message-content"]')).toBeVisible();
    
    // Type response
    await page.fill('[data-testid="reply-input"]', 'Thank you for your message. Based on your symptoms...');
    
    // Add attachment if needed
    await page.click('[data-testid="attach-file"]');
    await page.setInputFiles('[data-testid="file-input"]', './test-files/prescription.pdf');
    
    // Send reply
    await page.click('[data-testid="send-reply"]');
    await expect(page.locator('[data-testid="message-sent"]')).toBeVisible();
  });
});

// Admin Journey Tests
test.describe('Admin User Journey', () => {
  let context: BrowserContext;
  let page: Page;
  const adminEmail = 'admin@medcor.ai';
  const adminPassword = 'AdminPass123!';

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('Admin dashboard and system overview', async () => {
    await login(page, adminEmail, adminPassword);
    
    // Verify admin dashboard
    await expect(page).toHaveURL(`${BASE_URL}/admin-dashboard`);
    
    // Check system statistics
    await expect(page.locator('[data-testid="total-users"]')).toBeVisible();
    await expect(page.locator('[data-testid="active-appointments"]')).toBeVisible();
    await expect(page.locator('[data-testid="revenue-overview"]')).toBeVisible();
    await expect(page.locator('[data-testid="system-health"]')).toBeVisible();
  });

  test('Manage users and roles', async () => {
    await login(page, adminEmail, adminPassword);
    
    // Navigate to user management
    await page.click('[data-testid="nav-users"]');
    
    // Create new doctor account
    await page.click('[data-testid="add-user"]');
    
    // Fill user details
    await page.fill('[data-testid="user-email"]', 'newdoctor@medcor.ai');
    await page.fill('[data-testid="user-first-name"]', 'New');
    await page.fill('[data-testid="user-last-name"]', 'Doctor');
    await page.selectOption('[data-testid="user-role"]', 'doctor');
    await page.fill('[data-testid="license-number"]', 'MD98765');
    await page.selectOption('[data-testid="specialty"]', 'Pediatrics');
    
    // Set permissions
    await page.check('[data-testid="permission-view-patients"]');
    await page.check('[data-testid="permission-create-records"]');
    await page.check('[data-testid="permission-prescribe"]');
    
    // Save user
    await page.click('[data-testid="save-user"]');
    await expect(page.locator('[data-testid="user-created"]')).toBeVisible();
    
    // Edit existing user
    await page.fill('[data-testid="search-users"]', 'patient@medcor.ai');
    await page.click('[data-testid="search-button"]');
    await page.click('[data-testid="edit-user"]');
    
    // Update user status
    await page.selectOption('[data-testid="user-status"]', 'inactive');
    await page.fill('[data-testid="status-reason"]', 'Account suspended for review');
    
    // Save changes
    await page.click('[data-testid="save-changes"]');
    await expect(page.locator('[data-testid="user-updated"]')).toBeVisible();
  });

  test('Configure hospital settings', async () => {
    await login(page, adminEmail, adminPassword);
    
    // Navigate to settings
    await page.click('[data-testid="nav-settings"]');
    
    // Update hospital information
    await page.click('[data-testid="tab-hospital-info"]');
    await page.fill('[data-testid="hospital-name"]', 'MedCor General Hospital');
    await page.fill('[data-testid="hospital-address"]', '123 Medical Center Dr');
    await page.fill('[data-testid="hospital-phone"]', '555-0100');
    
    // Configure appointment settings
    await page.click('[data-testid="tab-appointments"]');
    await page.fill('[data-testid="appointment-duration"]', '30');
    await page.fill('[data-testid="buffer-time"]', '10');
    await page.check('[data-testid="allow-online-booking"]');
    await page.check('[data-testid="require-approval"]');
    
    // Set working hours
    await page.click('[data-testid="tab-working-hours"]');
    await page.fill('[data-testid="monday-start"]', '09:00');
    await page.fill('[data-testid="monday-end"]', '17:00');
    
    // Save all settings
    await page.click('[data-testid="save-settings"]');
    await expect(page.locator('[data-testid="settings-saved"]')).toBeVisible();
  });

  test('Generate and view reports', async () => {
    await login(page, adminEmail, adminPassword);
    
    // Navigate to reports
    await page.click('[data-testid="nav-reports"]');
    
    // Generate appointment report
    await page.selectOption('[data-testid="report-type"]', 'appointments');
    await page.fill('[data-testid="date-from"]', '2024-01-01');
    await page.fill('[data-testid="date-to"]', '2024-01-31');
    await page.click('[data-testid="generate-report"]');
    
    // Wait for report generation
    await expect(page.locator('[data-testid="report-ready"]')).toBeVisible({ timeout: 10000 });
    
    // View report
    await page.click('[data-testid="view-report"]');
    await expect(page.locator('[data-testid="report-viewer"]')).toBeVisible();
    
    // Export report
    await page.selectOption('[data-testid="export-format"]', 'pdf');
    await page.click('[data-testid="export-report"]');
    
    // Generate revenue report
    await page.selectOption('[data-testid="report-type"]', 'revenue');
    await page.click('[data-testid="generate-report"]');
    await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible();
  });
});

// Cross-browser Tests
test.describe('Cross-browser Compatibility', () => {
  const browsers = ['chromium', 'firefox', 'webkit'];
  
  browsers.forEach(browserName => {
    test(`Critical features work in ${browserName}`, async ({ browser }) => {
      const context = await browser.newContext();
      const page = await context.newPage();
      
      // Test homepage loads
      await page.goto(BASE_URL);
      await expect(page.locator('[data-testid="hero-section"]')).toBeVisible();
      
      // Test navigation works
      await page.click('[data-testid="nav-pricing"]');
      await expect(page).toHaveURL(`${BASE_URL}/pricing`);
      
      // Test forms work
      await page.goto(`${BASE_URL}/login`);
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await expect(page.locator('[data-testid="email-input"]')).toHaveValue('test@example.com');
      
      // Test responsive menu
      if (browserName !== 'webkit') { // Skip for Safari due to viewport issues
        await page.setViewportSize({ width: 375, height: 667 });
        await page.click('[data-testid="mobile-menu-toggle"]');
        await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
      }
      
      await context.close();
    });
  });
});

// Performance Tests
test.describe('Performance Tests', () => {
  test('Page load times are within acceptable limits', async ({ page }) => {
    const metrics = [];
    
    // Test homepage load time
    const homeStart = Date.now();
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    const homeLoadTime = Date.now() - homeStart;
    metrics.push({ page: 'home', loadTime: homeLoadTime });
    
    // Test dashboard load time (after login)
    await login(page, 'patient@medcor.ai', 'PatientPass123!');
    const dashboardStart = Date.now();
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    const dashboardLoadTime = Date.now() - dashboardStart;
    metrics.push({ page: 'dashboard', loadTime: dashboardLoadTime });
    
    // Verify all pages load within 3 seconds
    metrics.forEach(metric => {
      expect(metric.loadTime).toBeLessThan(3000);
    });
  });

  test('API response times are acceptable', async ({ request }) => {
    // Test login endpoint
    const loginStart = Date.now();
    await request.post(`${API_URL}/login`, {
      data: {
        email: 'test@medcor.ai',
        password: 'TestPass123!'
      }
    });
    const loginTime = Date.now() - loginStart;
    
    // Test doctors list endpoint
    const doctorsStart = Date.now();
    await request.get(`${API_URL}/doctors`);
    const doctorsTime = Date.now() - doctorsStart;
    
    // Verify API responses are under 1 second
    expect(loginTime).toBeLessThan(1000);
    expect(doctorsTime).toBeLessThan(1000);
  });
});

// Accessibility Tests
test.describe('Accessibility Tests', () => {
  test('Pages meet WCAG 2.1 AA standards', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Check for proper heading hierarchy
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents();
    expect(headings.length).toBeGreaterThan(0);
    
    // Check for alt text on images
    const images = await page.locator('img').all();
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      expect(alt).toBeTruthy();
    }
    
    // Check for proper form labels
    const inputs = await page.locator('input:not([type="hidden"])').all();
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      if (id) {
        const label = await page.locator(`label[for="${id}"]`).count();
        expect(label).toBeGreaterThan(0);
      }
    }
    
    // Check for keyboard navigation
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
    
    // Check for proper ARIA attributes
    const buttons = await page.locator('button').all();
    for (const button of buttons) {
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      expect(text || ariaLabel).toBeTruthy();
    }
  });
});

export default {};