# MedCor.ai Healthcare Platform API Documentation

## Swagger UI Access

The comprehensive API documentation is available through Swagger UI at the following URLs:

### Development Environment:
- **Swagger UI**: `http://localhost:8000/api/swagger/`
- **ReDoc Documentation**: `http://localhost:8000/api/redoc/`  
- **OpenAPI Schema**: `http://localhost:8000/api/schema/`

### Production Environment:
- **Swagger UI**: `https://your-production-domain.com/api/swagger/`
- **ReDoc Documentation**: `https://your-production-domain.com/api/redoc/`
- **OpenAPI Schema**: `https://your-production-domain.com/api/schema/`

## API Overview

The MedCor.ai Healthcare Platform API provides comprehensive endpoints for:

### 🔐 Authentication (`/api/auth/`)
- User registration and login
- JWT token management
- Password reset functionality
- Role-based access control (Admin, Clinic, Doctor, Patient)

### 🏥 Appointments (`/api/appointments/`)
- **Slots** - Doctor availability management
- **Slot Exclusions** - Unavailability periods
- **Appointments** - Full booking system with patient/doctor relationships

### 💊 Treatments (`/api/treatments/`)
- Medical procedures and services management
- Rich text descriptions with CKEditor
- Cost tracking and tenant-based filtering

### 🔬 Analysis (`/api/`)
- AI-powered hair analysis
- Skin analysis with recommendations
- Lips analysis and health assessment

### 👥 Chat (`/api/`)
- HeyGen avatar integration
- AI-powered conversation system
- Multi-language support

## API Features

### 🔒 Security
- JWT-based authentication
- Role-based access control
- Multi-tenant architecture
- CORS configuration

### 📊 Advanced Functionality
- Comprehensive filtering and search
- Pagination support
- Statistics and analytics endpoints
- File upload capabilities

### 📝 Documentation Standards
- OpenAPI 3.0 specification
- Comprehensive request/response examples
- Detailed parameter descriptions
- Error response documentation

## Available API Endpoints

### Appointment Management
```
GET    /api/appointments/slots/                    # List availability slots
POST   /api/appointments/slots/                    # Create availability slot
GET    /api/appointments/slots/{id}/               # Get slot details
PUT    /api/appointments/slots/{id}/               # Update slot
DELETE /api/appointments/slots/{id}/               # Delete slot
GET    /api/appointments/slots/by_doctor/          # Get slots by doctor
GET    /api/appointments/slots/available_slots/    # Get available slots

GET    /api/appointments/slot-exclusions/          # List slot exclusions
POST   /api/appointments/slot-exclusions/          # Create exclusion period
GET    /api/appointments/slot-exclusions/{id}/     # Get exclusion details
PUT    /api/appointments/slot-exclusions/{id}/     # Update exclusion
DELETE /api/appointments/slot-exclusions/{id}/     # Delete exclusion
GET    /api/appointments/slot-exclusions/by_doctor/ # Get exclusions by doctor

GET    /api/appointments/appointments/             # List appointments
POST   /api/appointments/appointments/             # Create appointment
GET    /api/appointments/appointments/{id}/        # Get appointment details
PUT    /api/appointments/appointments/{id}/        # Update appointment
DELETE /api/appointments/appointments/{id}/        # Delete appointment
GET    /api/appointments/appointments/my_appointments/ # Get user's appointments
GET    /api/appointments/appointments/by_status/   # Filter by status
GET    /api/appointments/appointments/statistics/  # Get statistics
PATCH  /api/appointments/appointments/{id}/update_status/ # Update status
GET    /api/appointments/appointments/search/      # Advanced search
```

### Treatment Management
```
GET    /api/treatments/                            # List treatments
POST   /api/treatments/                            # Create treatment
GET    /api/treatments/{id}/                       # Get treatment details
PUT    /api/treatments/{id}/                       # Update treatment
PATCH  /api/treatments/{id}/                       # Partially update treatment
DELETE /api/treatments/{id}/                       # Delete treatment
GET    /api/treatments/by-tenant/{tenant_id}/      # List treatments by tenant
GET    /api/treatments/search/                     # Search treatments
GET    /api/treatments/statistics/                 # Treatment statistics
```

### Authentication
```
POST   /api/auth/register/                         # User registration
POST   /api/auth/login/                           # User login
POST   /api/auth/refresh/                         # Refresh JWT token
POST   /api/auth/logout/                          # User logout
GET    /api/auth/profile/                         # Get user profile
PUT    /api/auth/profile/                         # Update user profile
POST   /api/auth/change-password/                 # Change password
POST   /api/auth/reset-password/                  # Reset password
```

### Analysis Tools
```
POST   /api/hair-analysis/                        # AI hair analysis
POST   /api/skin-analysis/                        # AI skin analysis
POST   /api/lips-analysis/                        # AI lips analysis
```

## Authentication

All API endpoints (except public registration/login) require JWT authentication:

```bash
# Include JWT token in requests
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -X GET http://localhost:8000/api/appointments/appointments/
```

## Example Usage

### Create Appointment
```bash
curl -X POST http://localhost:8000/api/appointments/appointments/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patient": 1,
    "doctor": 2,
    "treatment": 1,
    "appointment_slot_date": "2025-07-25",
    "appointment_slot_start_time": "10:00:00",
    "appointment_slot_end_time": "10:30:00",
    "appointment_status": "pending"
  }'
```

### Search Appointments
```bash
curl -X GET "http://localhost:8000/api/appointments/appointments/search/?q=john" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Statistics
```bash
curl -X GET http://localhost:8000/api/appointments/appointments/statistics/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Response Format

All API responses follow a consistent JSON format:

### Success Response
```json
{
  "status": "success",
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "status": "error",
  "error": "Error description",
  "details": { ... }
}
```

### Pagination Response
```json
{
  "count": 100,
  "next": "http://localhost:8000/api/appointments/appointments/?page=2",
  "previous": null,
  "results": [ ... ]
}
```

## Support

For technical support and API questions:
- Email: developer@medcor.ai
- Documentation: http://localhost:8000/api/swagger/
- Status: All endpoints documented with comprehensive examples and schemas