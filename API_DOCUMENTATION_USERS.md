# User API Documentation - MedCor Backend 2

## Overview
Every user in the MedCor system **MUST** belong to a hospital. This ensures proper multi-tenant data isolation and access control.

## Base URL
```
http://localhost:8002/api/auth/
```

## Authentication
Most endpoints require JWT authentication. Include the token in headers:
```
Authorization: Bearer <access_token>
```

---

## 1. List Available Hospitals
**GET** `/api/auth/hospitals/`

List all active hospitals available for user registration.

**Permission:** Public (no authentication required)

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Demo Hospital",
    "subdomain": "demo",
    "city": "San Francisco",
    "state": "CA",
    "country": "USA",
    "hospital_type": "General",
    "is_active": true
  }
]
```

---

## 2. User Registration
**GET** `/api/auth/register/`

Get registration form information and available hospitals.

**Permission:** Public

**Response:**
```json
{
  "available_hospitals": [
    {
      "id": "uuid",
      "name": "Demo Hospital",
      "city": "San Francisco",
      "state": "CA",
      "hospital_type": "General"
    }
  ],
  "role_choices": [
    ["SUPERADMIN", "Super Admin"],
    ["ADMIN", "Hospital Admin"],
    ["DOCTOR", "Doctor"],
    ["NURSE", "Nurse"],
    ["PATIENT", "Patient"],
    ["STAFF", "Staff"]
  ],
  "form_fields": {
    "email": "required",
    "password": "required (min 8 characters)",
    "hospital": "required (select from available_hospitals)",
    "role": "required (select from role_choices)"
  }
}
```

**POST** `/api/auth/register/`

Create a new user with hospital assignment.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepass123",
  "password_confirm": "securepass123",
  "first_name": "John",
  "last_name": "Doe",
  "hospital": "hospital-uuid",  // REQUIRED - Must be valid hospital ID
  "role": "PATIENT",
  "phone_number": "+1234567890",
  "department": "Cardiology",  // For staff/doctors/nurses
  "specialization": "Cardiologist"  // For doctors
}
```

**Response:**
```json
{
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "PATIENT",
    "hospital": "hospital-uuid",
    "hospital_name": "Demo Hospital",
    "hospital_details": {
      "id": "hospital-uuid",
      "name": "Demo Hospital",
      "city": "San Francisco"
    }
  },
  "tokens": {
    "access": "jwt-access-token",
    "refresh": "jwt-refresh-token"
  }
}
```

---

## 3. List Users
**GET** `/api/auth/users/`

List all users (filtered by hospital for non-superadmins).

**Permission:** Authenticated

**Query Parameters:**
- `role`: Filter by role (DOCTOR, PATIENT, NURSE, etc.)
- `search`: Search by name or email
- `hospital`: Filter by hospital ID (superadmin only)

**Response:**
```json
[
  {
    "id": "user-uuid",
    "email": "doctor@demo.com",
    "first_name": "John",
    "last_name": "Smith",
    "role": "DOCTOR",
    "hospital": "hospital-uuid",
    "hospital_name": "Demo Hospital",
    "hospital_details": {
      "id": "hospital-uuid",
      "name": "Demo Hospital",
      "city": "San Francisco",
      "state": "CA"
    },
    "department": "Cardiology",
    "specialization": "Cardiologist"
  }
]
```

---

## 4. Get User Details
**GET** `/api/auth/users/{id}/`

Get detailed information about a specific user.

**Permission:** Authenticated

**Response:**
```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "username": "johndoe",
  "first_name": "John",
  "last_name": "Doe",
  "full_name": "John Doe",
  "phone_number": "+1234567890",
  "role": "PATIENT",
  "hospital": "hospital-uuid",
  "hospital_name": "Demo Hospital",
  "hospital_details": {
    "id": "hospital-uuid",
    "name": "Demo Hospital",
    "subdomain": "demo",
    "city": "San Francisco",
    "state": "CA",
    "country": "USA",
    "hospital_type": "General",
    "is_active": true
  },
  "is_active": true,
  "is_verified": false,
  "created_at": "2025-01-16T10:00:00Z",
  "updated_at": "2025-01-16T10:00:00Z"
}
```

---

## 5. Create User (Admin)
**POST** `/api/auth/users/`

Create a new user (admin only).

**Permission:** Admin/Superadmin

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "securepass123",
  "password_confirm": "securepass123",
  "first_name": "Jane",
  "last_name": "Smith",
  "hospital": "hospital-uuid",  // REQUIRED
  "role": "NURSE",
  "department": "Emergency",
  "phone_number": "+1234567890"
}
```

**Response:** Same as user registration response

---

## 6. Update User
**PATCH** `/api/auth/users/{id}/`

Update user information.

**Permission:** Admin or own profile

**Request Body:**
```json
{
  "first_name": "Updated",
  "last_name": "Name",
  "phone_number": "+9876543210",
  "department": "ICU",
  "hospital": "new-hospital-uuid"  // Admin can reassign to different hospital
}
```

**Response:** Updated user object

---

## 7. Special Endpoints

### Get Doctors
**GET** `/api/auth/users/doctors/`

List all doctors in the hospital.

**Response:** List of doctors with appointment and patient counts

### Get Patients
**GET** `/api/auth/users/patients/`

List all patients in the hospital.

**Response:** List of patients with medical information

### Activate User
**POST** `/api/auth/users/{id}/activate/`

Activate a user account (admin only).

### Deactivate User
**POST** `/api/auth/users/{id}/deactivate/`

Deactivate a user account (admin only).

---

## Important Notes

1. **Hospital Assignment is Mandatory**: Every user MUST belong to a hospital. Registration will fail without a valid hospital ID.

2. **Hospital Filtering**: Non-superadmin users can only see and manage users within their own hospital.

3. **Role-Based Access**: Different roles have different permissions:
   - **SUPERADMIN**: Can manage all hospitals and users
   - **ADMIN**: Can manage users within their hospital
   - **DOCTOR/NURSE/STAFF**: Can view users within their hospital
   - **PATIENT**: Limited to own profile

4. **Hospital Reassignment**: Only admins can change a user's hospital assignment.

5. **Validation**: The system validates that:
   - The hospital exists and is active
   - The user hasn't exceeded the hospital's user limit
   - The email is unique across the entire system

---

## Error Responses

### Missing Hospital
```json
{
  "hospital": ["This field is required."]
}
```

### Invalid Hospital
```json
{
  "hospital": ["Invalid pk \"invalid-id\" - object does not exist."]
}
```

### Hospital at User Limit
```json
{
  "error": "This hospital has reached its maximum user limit."
}
```

---

## Testing with cURL

### List Available Hospitals
```bash
curl http://localhost:8002/api/auth/hospitals/
```

### Register New User
```bash
curl -X POST http://localhost:8002/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456",
    "password_confirm": "Test123456",
    "first_name": "Test",
    "last_name": "User",
    "hospital": "hospital-uuid-here",
    "role": "PATIENT"
  }'
```

### Get User with Hospital Details
```bash
curl -H "Authorization: Bearer <token>" \n  http://localhost:8002/api/auth/users/user-id/
```