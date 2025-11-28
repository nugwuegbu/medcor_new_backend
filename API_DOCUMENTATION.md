# MedCor Healthcare Platform API Documentation

## Table of Contents
1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [API Workflow](#api-workflow)
4. [Authentication](#authentication)
5. [Endpoints Reference](#endpoints-reference)
6. [Error Handling](#error-handling)
7. [Examples](#examples)

## Overview

MedCor Healthcare Platform provides a comprehensive REST API for managing healthcare operations including:
- Multi-tenant hospital management
- User authentication and authorization
- Doctor and patient management
- Appointment scheduling
- Medical records management
- Treatment and prescription tracking
- Doctor specialization management
- Subscription plans for hospitals

**Base URL**: `https://api.medcor.ai` (Production) | `http://localhost:8002` (Development)

## Getting Started

### Prerequisites
- API credentials (contact support@medcor.ai)
- Hospital/Tenant ID (provided during onboarding)
- Understanding of JWT authentication

### Quick Start Workflow

Follow these steps in order to set up your healthcare platform:

```
1. Create Hospital → 2. Register Admin → 3. Create Users → 4. Set Up Services → 5. Start Operations
```

## API Workflow

### Step 1: Hospital Setup

#### 1.1 Create a Hospital (Admin Only)
```http
POST /api/hospitals/
Content-Type: application/json

{
  "name": "City General Hospital",
  "city": "New York",
  "state": "NY",
  "country": "USA",
  "hospital_type": "general",
  "contact_email": "admin@citygeneral.com",
  "contact_phone": "+1-212-555-0100"
}
```

**Response**: Returns hospital object with `id` (use this as tenant ID)

### Step 2: User Management

#### 2.1 Register First Admin User
```http
POST /api/auth/register/
Content-Type: application/json

{
  "email": "admin@hospital.com",
  "password": "SecurePassword123!",
  "password_confirm": "SecurePassword123!",
  "first_name": "John",
  "last_name": "Admin",
  "role": "admin",
  "hospital": 1,  // Hospital ID from Step 1
  "phone_number": "+1-212-555-0101"
}
```

#### 2.2 Login to Get JWT Token
```http
POST /api/auth/login/
Content-Type: application/json

{
  "email": "admin@hospital.com",
  "password": "SecurePassword123!"
}
```

**Response**:
```json
{
  "user": { /* user details */ },
  "tokens": {
    "access": "eyJ0eXAiOiJKV1Q...",  // Use this for API calls
    "refresh": "eyJ0eXAiOiJKV1Q..."   // Use to refresh access token
  }
}
```

### Step 3: Create Core Users

#### 3.1 Create a Doctor
```http
POST /api/auth/users/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "email": "dr.smith@hospital.com",
  "username": "drsmith",
  "password": "DoctorPass123!",
  "first_name": "Jane",
  "last_name": "Smith",
  "role": "doctor",
  "hospital": 1,
  "department": "Cardiology",
  "license_number": "MD123456",
  "years_of_experience": 10
}
```

#### 3.2 Assign Specialty to Doctor
```http
POST /api/specialty/doctor-specialties/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "doctor": 2,  // Doctor user ID
  "specialty": 5,  // Cardiology specialty ID
  "is_primary": true,
  "years_of_experience": 10,
  "certification_date": "2014-06-15"
}
```

#### 3.3 Create a Patient
```http
POST /api/auth/users/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "email": "patient@email.com",
  "username": "patient001",
  "password": "PatientPass123!",
  "first_name": "Alice",
  "last_name": "Johnson",
  "role": "patient",
  "hospital": 1,
  "date_of_birth": "1985-03-20",
  "phone_number": "+1-212-555-0200",
  "blood_type": "O+",
  "allergies": "Penicillin",
  "emergency_contact_name": "Bob Johnson",
  "emergency_contact_phone": "+1-212-555-0201"
}
```

### Step 4: Set Up Medical Services

#### 4.1 Create Doctor Availability Slots
```http
POST /api/appointments/availability-slots/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "doctor": 2,
  "start_time": "2025-01-20T09:00:00Z",
  "end_time": "2025-01-20T17:00:00Z",
  "is_available": true
}
```

#### 4.2 Create Patient Medical Record
```http
POST /api/medical-records/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "patient": 3,
  "record_type": "general",
  "title": "Initial Health Assessment",
  "description": "Patient initial consultation and health history",
  "diagnosis": "General checkup - healthy",
  "symptoms": "None",
  "vital_signs": {
    "blood_pressure": "120/80",
    "heart_rate": 72,
    "temperature": 98.6,
    "weight": 70
  }
}
```

### Step 5: Operational Workflows

#### 5.1 Book an Appointment
```http
POST /api/appointments/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "patient": 3,
  "doctor": 2,
  "slot": 1,  // Availability slot ID
  "appointment_type": "consultation",
  "reason": "Regular checkup",
  "notes": "Patient requests morning appointment"
}
```

#### 5.2 Record Treatment
```http
POST /api/treatments/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "appointment": 1,
  "patient": 3,
  "doctor": 2,
  "diagnosis": "Mild hypertension",
  "treatment_plan": "Lifestyle changes and medication",
  "notes": "Monitor blood pressure weekly",
  "follow_up_required": true,
  "follow_up_date": "2025-02-20"
}
```

#### 5.3 Issue Prescription
```http
POST /api/treatments/{treatment_id}/prescriptions/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "medication_name": "Lisinopril",
  "dosage": "10mg",
  "frequency": "Once daily",
  "duration": "30 days",
  "instructions": "Take with food in the morning"
}
```

## Endpoints Reference

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register/` | Register new user | No |
| POST | `/api/auth/login/` | Login user | No |
| POST | `/api/auth/logout/` | Logout user | Yes |
| POST | `/api/auth/token/refresh/` | Refresh access token | No |
| GET | `/api/auth/profile/` | Get current user profile | Yes |
| PUT | `/api/auth/profile/` | Update current user profile | Yes |
| POST | `/api/auth/change-password/` | Change password | Yes |

### Hospital Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/hospitals/` | List all hospitals | Yes (Admin) |
| POST | `/api/hospitals/` | Create new hospital | Yes (Admin) |
| GET | `/api/hospitals/{id}/` | Get hospital details | Yes |
| PUT | `/api/hospitals/{id}/` | Update hospital | Yes (Admin) |
| DELETE | `/api/hospitals/{id}/` | Delete hospital | Yes (Admin) |
| GET | `/api/hospitals/{id}/statistics/` | Get hospital statistics | Yes |

### User Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/auth/users/` | List users | Yes |
| POST | `/api/auth/users/` | Create user | Yes (Admin) |
| GET | `/api/auth/users/{id}/` | Get user details | Yes |
| PUT | `/api/auth/users/{id}/` | Update user | Yes |
| DELETE | `/api/auth/users/{id}/` | Deactivate user | Yes (Admin) |
| GET | `/api/auth/users/doctors/` | List all doctors | Yes |
| GET | `/api/auth/users/patients/` | List all patients | Yes |
| POST | `/api/auth/users/{id}/activate/` | Activate user | Yes (Admin) |
| POST | `/api/auth/users/{id}/deactivate/` | Deactivate user | Yes (Admin) |

### Appointments

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/appointments/` | List appointments | Yes |
| POST | `/api/appointments/` | Create appointment | Yes |
| GET | `/api/appointments/{id}/` | Get appointment details | Yes |
| PUT | `/api/appointments/{id}/` | Update appointment | Yes |
| DELETE | `/api/appointments/{id}/` | Cancel appointment | Yes |
| POST | `/api/appointments/{id}/confirm/` | Confirm appointment | Yes |
| POST | `/api/appointments/{id}/cancel/` | Cancel appointment | Yes |
| POST | `/api/appointments/{id}/complete/` | Mark as completed | Yes |
| GET | `/api/appointments/availability-slots/` | List availability slots | Yes |
| POST | `/api/appointments/availability-slots/` | Create availability slot | Yes (Doctor) |
| GET | `/api/appointments/availability-slots/{id}/` | Get slot details | Yes |

### Medical Records

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/medical-records/` | List medical records | Yes |
| POST | `/api/medical-records/` | Create medical record | Yes (Doctor) |
| GET | `/api/medical-records/{id}/` | Get record details | Yes |
| PUT | `/api/medical-records/{id}/` | Update record | Yes (Doctor) |
| DELETE | `/api/medical-records/{id}/` | Delete record | Yes (Doctor) |
| GET | `/api/medical-records/patient/{patient_id}/` | Get patient's records | Yes |
| POST | `/api/medical-records/{id}/attachments/` | Add attachment | Yes |

### Treatments

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/treatments/` | List treatments | Yes |
| POST | `/api/treatments/` | Create treatment | Yes (Doctor) |
| GET | `/api/treatments/{id}/` | Get treatment details | Yes |
| PUT | `/api/treatments/{id}/` | Update treatment | Yes (Doctor) |
| GET | `/api/treatments/{id}/prescriptions/` | List prescriptions | Yes |
| POST | `/api/treatments/{id}/prescriptions/` | Add prescription | Yes (Doctor) |
| GET | `/api/treatments/prescriptions/{id}/` | Get prescription details | Yes |
| PUT | `/api/treatments/prescriptions/{id}/` | Update prescription | Yes (Doctor) |

### Specialties

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/specialty/` | List all specialties | Yes |
| POST | `/api/specialty/` | Create specialty | Yes (Admin) |
| GET | `/api/specialty/{id}/` | Get specialty details | Yes |
| GET | `/api/specialty/popular/` | Get popular specialties | Yes |
| GET | `/api/specialty/statistics/` | Get specialty statistics | Yes |
| GET | `/api/specialty/doctor-specialties/` | List doctor specialties | Yes |
| POST | `/api/specialty/doctor-specialties/` | Assign specialty to doctor | Yes (Admin) |
| GET | `/api/specialty/doctor-specialties/{id}/` | Get doctor specialty details | Yes |
| PUT | `/api/specialty/doctor-specialties/{id}/` | Update doctor specialty | Yes |
| DELETE | `/api/specialty/doctor-specialties/{id}/` | Remove doctor specialty | Yes (Admin) |

### Subscription Plans

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/subscription-plans/` | List subscription plans | Yes |
| POST | `/api/subscription-plans/` | Create plan | Yes (Admin) |
| GET | `/api/subscription-plans/{id}/` | Get plan details | Yes |
| PUT | `/api/subscription-plans/{id}/` | Update plan | Yes (Admin) |
| DELETE | `/api/subscription-plans/{id}/` | Delete plan | Yes (Admin) |
| POST | `/api/subscription-plans/{id}/subscribe/` | Subscribe to plan | Yes |

### Chat & Voice APIs

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/chat/` | Send chat message | Yes |
| POST | `/api/chat/voice/` | Voice interaction | Yes |
| POST | `/api/avatar/create/` | Create avatar session | Yes |
| POST | `/api/avatar/start/` | Start avatar | Yes |
| POST | `/api/avatar/speak/` | Make avatar speak | Yes |
| POST | `/api/avatar/stop/` | Stop avatar | Yes |
| GET | `/api/chat/sessions/` | List chat sessions | Yes |
| GET | `/api/chat/messages/{session_id}/` | Get session messages | Yes |

## Authentication

### JWT Token Usage

Include the JWT access token in the Authorization header for all authenticated requests:

```http
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

### Token Refresh

When the access token expires (after 60 minutes), use the refresh token to get a new access token:

```http
POST /api/auth/token/refresh/
Content-Type: application/json

{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Response**:
```json
{
  "access": "new_access_token_here"
}
```

## Error Handling

### Standard Error Response Format

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": ["Field-specific error message"]
    }
  }
}
```

### Common HTTP Status Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Unprocessable Entity |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

## Examples

### Complete Appointment Booking Flow

```python
import requests
import json

# Configuration
API_BASE = "http://localhost:8002"
headers = {"Content-Type": "application/json"}

# Step 1: Login
login_data = {
    "email": "patient@email.com",
    "password": "PatientPass123!"
}
response = requests.post(f"{API_BASE}/api/auth/login/", json=login_data)
tokens = response.json()["tokens"]
headers["Authorization"] = f"Bearer {tokens['access']}"

# Step 2: Get available doctors
doctors = requests.get(f"{API_BASE}/api/auth/users/doctors/", headers=headers)
doctor_id = doctors.json()[0]["id"]

# Step 3: Get doctor's availability
slots = requests.get(
    f"{API_BASE}/api/appointments/availability-slots/",
    params={"doctor": doctor_id, "is_available": True},
    headers=headers
)
slot_id = slots.json()["results"][0]["id"]

# Step 4: Book appointment
appointment_data = {
    "patient": 3,
    "doctor": doctor_id,
    "slot": slot_id,
    "appointment_type": "consultation",
    "reason": "Regular checkup"
}
appointment = requests.post(
    f"{API_BASE}/api/appointments/",
    json=appointment_data,
    headers=headers
)
print(f"Appointment booked: {appointment.json()}")
```

### Creating a Doctor with Specialty

```python
# Step 1: Create doctor user
doctor_data = {
    "email": "dr.wilson@hospital.com",
    "username": "drwilson",
    "password": "DoctorPass123!",
    "first_name": "Robert",
    "last_name": "Wilson",
    "role": "doctor",
    "hospital": 1,
    "department": "Neurology",
    "license_number": "MD789012",
    "years_of_experience": 15
}
doctor = requests.post(
    f"{API_BASE}/api/auth/users/",
    json=doctor_data,
    headers=headers
)
doctor_id = doctor.json()["id"]

# Step 2: Get neurology specialty ID
specialties = requests.get(
    f"{API_BASE}/api/specialty/",
    params={"search": "Neurology"},
    headers=headers
)
neurology_id = specialties.json()["results"][0]["id"]

# Step 3: Assign specialty to doctor
specialty_data = {
    "doctor": doctor_id,
    "specialty": neurology_id,
    "is_primary": True,
    "years_of_experience": 15,
    "certification_date": "2010-08-20"
}
assignment = requests.post(
    f"{API_BASE}/api/specialty/doctor-specialties/",
    json=specialty_data,
    headers=headers
)
print(f"Specialty assigned: {assignment.json()}")
```

## API Testing

### Using Swagger UI

Access the interactive API documentation:
- Development: `http://localhost:8002/api/docs/`
- Production: `https://api.medcor.ai/api/docs/`

### Using ReDoc

Access the detailed API documentation:
- Development: `http://localhost:8002/api/redoc/`
- Production: `https://api.medcor.ai/api/redoc/`

### Postman Collection

Download our Postman collection for easy API testing:
[Download Postman Collection](https://api.medcor.ai/static/medcor-api.postman_collection.json)

## Rate Limiting

- **Authenticated Users**: 100 requests per minute
- **Unauthenticated Users**: 20 requests per minute
- **Bulk Operations**: 10 requests per minute

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Unix timestamp when limit resets

## Pagination

List endpoints support pagination:

```http
GET /api/appointments/?page=2&page_size=50
```

Response includes:
```json
{
  "count": 245,
  "next": "http://api.medcor.ai/api/appointments/?page=3",
  "previous": "http://api.medcor.ai/api/appointments/?page=1",
  "results": [...]
}
```

## Filtering & Searching

Most list endpoints support filtering:

```http
GET /api/auth/users/?role=doctor&search=smith&ordering=-created_at
```

Common query parameters:
- `search`: Search in text fields
- `ordering`: Sort results (prefix with `-` for descending)
- `role`: Filter by user role
- `hospital`: Filter by hospital ID
- `date_from` / `date_to`: Date range filtering

## Webhooks

Configure webhooks for real-time notifications:

```http
POST /api/webhooks/
{
  "url": "https://your-server.com/webhook",
  "events": ["appointment.created", "appointment.cancelled"],
  "secret": "your-webhook-secret"
}
```

## Support

- **Documentation**: https://medcor.ai/docs
- **API Status**: https://status.medcor.ai
- **Support Email**: support@medcor.ai
- **Developer Portal**: https://developers.medcor.ai

## Changelog

### Version 2.0.0 (Current)
- Added doctor specialization management
- Enhanced multi-tenant architecture
- Improved appointment scheduling
- Added comprehensive medical records API
- Implemented treatment and prescription tracking

### Version 1.0.0
- Initial API release
- Basic authentication and user management
- Hospital management
- Simple appointment booking