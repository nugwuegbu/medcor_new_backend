# QA Test Suite Documentation
## MedCor Healthcare Platform

### Overview
This comprehensive QA test suite covers all aspects of the MedCor Healthcare Platform, including frontend components, backend APIs, integration tests, and end-to-end user journeys.

## Test Coverage

### 1. Frontend Component Tests (`frontend/components.test.tsx`)
Tests React components in isolation:
- **Authentication Modal**: Login/signup forms, validation, role selection
- **Navigation Bar**: Menu items, role-based access, logout functionality
- **Doctor Card**: Display information, availability status, booking actions
- **Appointment Form**: Field validation, date/time selection, submission
- **Chat Interface**: Message sending, AI responses, typing indicators
- **Medical Records View**: Record display, filtering, sorting, detail views
- **Face Analysis Widget**: Camera permissions, image capture, analysis

### 2. Backend API Tests (`backend/api_tests.py`)
Django REST Framework API testing:
- **Authentication**: User registration, login, logout, token management
- **Doctor Endpoints**: List doctors, filters, profile updates, permissions
- **Appointments**: Booking, cancellation, rescheduling, conflict detection
- **Medical Records**: CRUD operations, file uploads, access control
- **Chat/Messaging**: Patient-doctor communication, AI chat integration
- **Subscriptions**: Payment plans, Stripe integration, billing management
- **Multi-tenancy**: Tenant isolation, hospital admin permissions
- **Security**: Rate limiting, SQL injection prevention, XSS protection

### 3. End-to-End Tests (`e2e/user-journeys.test.ts`)
Complete user workflows using Playwright:
- **Patient Journey**: Registration, appointment booking, chat consultations, medical records
- **Doctor Journey**: Dashboard, consultations, medical records, patient messages
- **Admin Journey**: User management, hospital settings, report generation
- **Cross-browser**: Compatibility testing across Chrome, Firefox, Safari
- **Performance**: Page load times, API response times
- **Accessibility**: WCAG 2.1 AA compliance, keyboard navigation

### 4. Integration Tests (`integration/api-integration.test.ts`)
API integration and data flow:
- **Authentication Flow**: Registration, login, token refresh
- **Appointment Booking**: Doctor search, availability, booking flow
- **Medical Records**: Create, update, document upload
- **Chat & AI**: AI consultations, health recommendations
- **Payments**: Subscription plans, payment methods, billing
- **Multi-tenant**: Tenant-specific access, data isolation
- **WebSocket**: Real-time notifications, chat messages

## Setup Instructions

### Prerequisites
```bash
# Node.js 18+ and Python 3.9+ required
node --version
python --version

# Install dependencies
npm install
pip install -r requirements.txt
```

### Environment Configuration
Create `.env.test` file:
```env
# Frontend
BASE_URL=http://localhost:5000
VITE_API_URL=http://localhost:8000/api

# Backend
DATABASE_URL=postgresql://test_user:test_pass@localhost:5432/medcor_test
DJANGO_SECRET_KEY=test-secret-key-for-testing
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1

# External Services (Test Keys)
STRIPE_SECRET_KEY=sk_test_...
OPENAI_API_KEY=test-key
HEYGEN_API_KEY=test-key
```

### Database Setup
```bash
# Create test database
createdb medcor_test

# Run migrations
cd medcor_backend
python manage.py migrate --settings=medcor_backend.settings.test

# Load test fixtures
python manage.py loaddata test_fixtures.json
```

## Running Tests

### All Tests
```bash
# Run all test suites
npm run test:all

# With coverage report
npm run test:coverage
```

### Frontend Component Tests
```bash
# Run Jest tests
npm run test:frontend

# Watch mode for development
npm run test:frontend:watch

# With coverage
npm run test:frontend:coverage
```

### Backend API Tests
```bash
# Run Django tests
cd medcor_backend
python manage.py test --settings=medcor_backend.settings.test

# Specific app tests
python manage.py test api.tests.AuthenticationTests

# With coverage
coverage run --source='.' manage.py test
coverage report
coverage html
```

### End-to-End Tests
```bash
# Run Playwright tests
npm run test:e2e

# Specific browser
npm run test:e2e -- --project=chromium

# Debug mode with headed browser
npm run test:e2e -- --debug

# Generate report
npm run test:e2e:report
```

### Integration Tests
```bash
# Run integration tests
npm run test:integration

# Specific test suite
npm run test:integration -- --testNamePattern="Authentication Flow"
```

## Test Commands

Add to `package.json`:
```json
{
  "scripts": {
    "test": "jest",
    "test:frontend": "jest --config=qa-tests/jest.config.js",
    "test:frontend:watch": "jest --config=qa-tests/jest.config.js --watch",
    "test:frontend:coverage": "jest --config=qa-tests/jest.config.js --coverage",
    "test:integration": "jest --config=qa-tests/jest.config.js integration/",
    "test:e2e": "playwright test --config=qa-tests/playwright.config.ts",
    "test:e2e:debug": "playwright test --config=qa-tests/playwright.config.ts --debug",
    "test:e2e:report": "playwright show-report qa-tests/playwright-report",
    "test:backend": "cd medcor_backend && python manage.py test",
    "test:all": "npm run test:frontend && npm run test:integration && npm run test:e2e && npm run test:backend",
    "test:coverage": "npm run test:frontend:coverage && cd medcor_backend && coverage run manage.py test && coverage report"
  }
}
```

## CI/CD Integration

### GitHub Actions Example
```yaml
name: QA Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:frontend:coverage
      - uses: codecov/codecov-action@v3

  backend-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.9'
      - run: pip install -r requirements.txt
      - run: cd medcor_backend && python manage.py test

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: qa-tests/playwright-report/
```

## Test Data Management

### Test Users
```javascript
// Default test accounts
const TEST_USERS = {
  patient: {
    email: 'patient@medcor.ai',
    password: 'PatientPass123!'
  },
  doctor: {
    email: 'doctor@medcor.ai',
    password: 'DoctorPass123!'
  },
  admin: {
    email: 'admin@medcor.ai',
    password: 'AdminPass123!'
  },
  hospitalAdmin: {
    email: 'hospital.admin@hospital1.com',
    password: 'HospitalAdmin123!'
  }
};
```

### Test Data Fixtures
```python
# medcor_backend/fixtures/test_data.py
SAMPLE_APPOINTMENTS = [
    {
        'patient_id': 1,
        'doctor_id': 2,
        'date': '2024-02-01',
        'time': '10:00',
        'status': 'scheduled'
    }
]

SAMPLE_MEDICAL_RECORDS = [
    {
        'patient_id': 1,
        'doctor_id': 2,
        'type': 'consultation',
        'diagnosis': 'Common Cold',
        'prescription': 'Rest and fluids'
    }
]
```

## Performance Benchmarks

### Expected Response Times
- **Page Load**: < 3 seconds
- **API Response**: < 1 second
- **Search Operations**: < 2 seconds
- **File Upload**: < 5 seconds (for files up to 10MB)
- **Real-time Chat**: < 500ms latency

### Load Testing
```bash
# Using Artillery for load testing
npm install -g artillery

# Run load test
artillery run qa-tests/load-test.yml
```

## Debugging Failed Tests

### Frontend Tests
```bash
# Run with verbose output
npm run test:frontend -- --verbose

# Debug specific test
npm run test:frontend -- --testNamePattern="should render login form"

# Update snapshots
npm run test:frontend -- -u
```

### E2E Tests
```bash
# Debug mode with browser
npx playwright test --debug

# Generate trace for failed test
npx playwright test --trace on

# View trace
npx playwright show-trace trace.zip
```

### Backend Tests
```python
# Run with verbose output
python manage.py test --verbosity=2

# Keep test database for inspection
python manage.py test --keepdb

# Run specific test method
python manage.py test api.tests.AuthenticationTests.test_user_login_success
```

## Best Practices

### 1. Test Naming
- Use descriptive test names that explain what is being tested
- Follow pattern: `test_[what]_[condition]_[expected_result]`
- Example: `test_user_login_with_invalid_credentials_returns_401`

### 2. Test Organization
- Group related tests in describe blocks
- Use setup and teardown methods appropriately
- Keep tests independent and idempotent

### 3. Assertions
- Use specific assertions rather than generic ones
- Test both positive and negative cases
- Include edge cases and boundary conditions

### 4. Test Data
- Use factories or fixtures for test data
- Clean up test data after each test
- Avoid hardcoded values, use constants

### 5. Mocking
- Mock external services (Stripe, OpenAI, etc.)
- Use test doubles for complex dependencies
- Keep mocks simple and focused

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Kill process on port
lsof -ti:5000 | xargs kill -9
lsof -ti:8000 | xargs kill -9
```

#### Database Connection Issues
```bash
# Reset test database
dropdb medcor_test
createdb medcor_test
python manage.py migrate --settings=medcor_backend.settings.test
```

#### Playwright Browser Issues
```bash
# Reinstall browsers
npx playwright install --force
npx playwright install-deps
```

#### Jest Module Resolution
```bash
# Clear Jest cache
npm run test:frontend -- --clearCache
```

## Test Reports

### Coverage Reports
- **Frontend**: `qa-tests/coverage/lcov-report/index.html`
- **Backend**: `medcor_backend/htmlcov/index.html`
- **E2E**: `qa-tests/playwright-report/index.html`

### Test Metrics
- **Coverage Target**: 80% for critical paths
- **Test Execution Time**: < 10 minutes for full suite
- **Flakiness Rate**: < 2% acceptable

## Continuous Improvement

### Monthly Review
1. Analyze test failures and flakiness
2. Update test data and fixtures
3. Add tests for new features
4. Remove obsolete tests
5. Optimize slow tests

### Test Maintenance
- Review and update tests with each feature change
- Keep test documentation current
- Regular dependency updates
- Performance baseline updates

## Contact

For questions or issues with the test suite:
- **QA Lead**: qa@medcor.ai
- **Documentation**: [Internal Wiki](https://wiki.medcor.ai/qa)
- **Issue Tracking**: [JIRA Board](https://medcor.atlassian.net)