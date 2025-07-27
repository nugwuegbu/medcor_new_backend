# Multi-Tenant API Request Guide

## Overview
The MedCor healthcare platform uses Django multi-tenant architecture where each hospital/clinic has its own isolated data schema. API requests must specify the tenant through the `Host` header.

## Available Tenants

### 1. Public Schema (Default)
- **Schema**: `public`
- **Domain**: `localhost:8000`
- **Use Case**: System administration, tenant management
- **Login**: `admin@localhost` / `admin123`

### 2. MedCor Hospital
- **Schema**: `medcorhospital`  
- **Domain**: `medcorhospital.localhost:8000`
- **Use Case**: Hospital-specific patient and appointment data
- **Login**: `hospital@localhost` / `hospital123`

### 3. MedCor Clinic
- **Schema**: `medcorclinic`
- **Domain**: `medcorclinic.localhost:8000`
- **Use Case**: Clinic-specific patient and appointment data  
- **Login**: `clinic@localhost` / `clinic123`

## Making Tenant-Specific API Requests

### Authentication (Get JWT Token)

```bash
# Public Schema Login
curl -X POST "http://localhost:8000/api/auth/login/" \
  -H "Host: localhost:8000" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@localhost", "password": "admin123"}'

# Hospital Schema Login  
curl -X POST "http://localhost:8000/api/auth/login/" \
  -H "Host: medcorhospital.localhost:8000" \
  -H "Content-Type: application/json" \
  -d '{"email": "hospital@localhost", "password": "hospital123"}'

# Clinic Schema Login
curl -X POST "http://localhost:8000/api/auth/login/" \
  -H "Host: medcorclinic.localhost:8000" \
  -H "Content-Type: application/json" \
  -d '{"email": "clinic@localhost", "password": "clinic123"}'
```

### API Endpoints by Tenant

```bash
# Hospital Patient Data (isolated to hospital schema)
curl -H "Host: medcorhospital.localhost:8000" \
     -H "Authorization: Bearer YOUR_HOSPITAL_TOKEN" \
     "http://localhost:8000/api/medical/patients/"

# Clinic Patient Data (isolated to clinic schema)  
curl -H "Host: medcorclinic.localhost:8000" \
     -H "Authorization: Bearer YOUR_CLINIC_TOKEN" \
     "http://localhost:8000/api/medical/patients/"

# Hospital Appointments
curl -H "Host: medcorhospital.localhost:8000" \
     -H "Authorization: Bearer YOUR_HOSPITAL_TOKEN" \
     "http://localhost:8000/api/medical/appointments/"

# Clinic Appointments
curl -H "Host: medcorclinic.localhost:8000" \
     -H "Authorization: Bearer YOUR_CLINIC_TOKEN" \
     "http://localhost:8000/api/medical/appointments/"
```

## JavaScript/Node.js Examples

### Tenant-Specific Fetch Requests

```javascript
// Hospital API Request
const hospitalResponse = await fetch('http://localhost:8000/api/medical/patients/', {
  headers: {
    'Host': 'medcorhospital.localhost:8000',
    'Authorization': 'Bearer ' + hospitalToken,
    'Content-Type': 'application/json'
  }
});

// Clinic API Request  
const clinicResponse = await fetch('http://localhost:8000/api/medical/patients/', {
  headers: {
    'Host': 'medcorclinic.localhost:8000', 
    'Authorization': 'Bearer ' + clinicToken,
    'Content-Type': 'application/json'
  }
});
```

### React/Frontend Integration

```javascript
// Tenant-aware API client
class TenantAPIClient {
  constructor(tenantDomain, baseUrl = 'http://localhost:8000') {
    this.tenantDomain = tenantDomain;
    this.baseUrl = baseUrl;
    this.token = null;
  }
  
  async login(email, password) {
    const response = await fetch(`${this.baseUrl}/api/auth/login/`, {
      method: 'POST',
      headers: {
        'Host': this.tenantDomain,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    this.token = data.access_token;
    return data;
  }
  
  async apiRequest(endpoint, options = {}) {
    return fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Host': this.tenantDomain,
        'Authorization': this.token ? `Bearer ${this.token}` : undefined,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
  }
}

// Usage Examples
const hospitalClient = new TenantAPIClient('medcorhospital.localhost:8000');
const clinicClient = new TenantAPIClient('medcorclinic.localhost:8000');

// Login and fetch hospital patients
await hospitalClient.login('hospital@localhost', 'hospital123');
const hospitalPatients = await hospitalClient.apiRequest('/api/medical/patients/');

// Login and fetch clinic patients  
await clinicClient.login('clinic@localhost', 'clinic123');
const clinicPatients = await clinicClient.apiRequest('/api/medical/patients/');
```

## Available API Endpoints per Tenant

### Core Medical APIs (Tenant-Isolated)
- `/api/medical/patients/` - Tenant-specific patients
- `/api/medical/doctors/` - Tenant-specific doctors  
- `/api/medical/appointments/` - Tenant-specific appointments
- `/api/medical/treatments/` - Available treatments

### Authentication APIs
- `/api/auth/login/` - Tenant-specific login
- `/api/auth/logout/` - Logout current user
- `/api/auth/user/` - Get current user profile

### Admin APIs (Public Schema Only)
- `/api/tenants/` - Manage hospital/clinic tenants
- `/api/subscription/` - Subscription plans and billing

## Important Notes

1. **Data Isolation**: Each tenant has completely isolated data - hospital patients are not visible to clinic users and vice versa.

2. **Authentication Tokens**: JWT tokens are tenant-specific. A token obtained from hospital login cannot access clinic data.

3. **Host Header Required**: The `Host` header determines which tenant schema to use. Without it, requests default to public schema.

4. **Schema Switching**: Django automatically switches database schemas based on the tenant domain in the Host header.

5. **API Documentation**: Each tenant has access to the same API documentation at `/api/docs/` but sees only their tenant-specific data.

## Testing the Setup

Run the automated test script to verify multi-tenant functionality:

```bash
node test-tenant-api-requests.js
```

This will test all tenant endpoints and show data isolation in action.