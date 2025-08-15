# MedCor Backend MCP Server Implementation

## Overview
The Model Context Protocol (MCP) server provides programmatic access to the MedCor healthcare management system. It exposes comprehensive REST-like endpoints through tools and resources for managing hospitals, doctors, specialties, medical records, appointments, and more.

## Installation & Running

```bash
# From the medcor_backend2 directory
python mcp_server.py
```

The MCP server will automatically:
1. Set up Django environment
2. Connect to the PostgreSQL database
3. Load all Django models
4. Start the FastMCP server

## Features

### Complete REST Endpoint Coverage

The MCP server now provides comprehensive endpoints for:

#### 1. **Hospitals (Tenants)**
- `create_hospital` - Create new hospital/clinic
- `list_hospitals` - List all hospitals with filters (city, type, status)
- `get_hospital_details` - Get detailed hospital information with statistics
- `update_hospital` - Update hospital information

#### 2. **Doctors Management**
- `list_doctors` - List doctors with specialty/department filters
- `get_doctor_details` - Get comprehensive doctor profile with specialties
- Enhanced with:
  - Primary specialty tracking
  - Multiple specialties support
  - Appointment statistics
  - Experience and certification tracking

#### 3. **Specialty Management** (NEW)
- `list_specialties` - List all medical specialties
- `create_specialty` - Create new medical specialty
- `assign_doctor_specialty` - Assign specialty to doctor
- `list_doctor_specialties` - List all specialties for a doctor
- `get_doctors_by_specialty` - Find doctors by specialty in a hospital

Supports 27+ medical specializations including:
- Pediatrics, Gynecology, Cardiology
- Orthopedics, Dermatology, Psychiatry
- And many more...

#### 4. **Medical Records**
- `create_medical_record` - Create patient medical records
- `list_medical_records` - List records with multiple filters
- `get_medical_record_details` - Get detailed record information
- `update_medical_record` - Update existing records
- Enhanced filtering by:
  - Patient, Doctor, Date range
  - Record type, Hospital

#### 5. **Appointments**
- `create_appointment` - Schedule appointments
- `list_appointments` - List with status/date filters
- `update_appointment_status` - Update appointment status
- `list_appointment_slots` - Check doctor availability

#### 6. **Treatments & Prescriptions**
- `create_treatment` - Create treatment plans
- `list_treatments` - List treatments with filters

#### 7. **User Management**
- `create_user` - Create users with roles
- `list_users` - List users by role/hospital

#### 8. **Subscriptions**
- `create_subscription` - Manage hospital subscriptions
- `list_subscription_plans` - Available plans

## Resource Endpoints

The MCP server exposes RESTful resources accessible via URL patterns:

### Hospital Resources
- `hospitals://list` - Get all hospitals
- `hospitals://details/{hospital_id}` - Hospital details

### Doctor Resources
- `doctors://list/{hospital_id}` - Doctors in a hospital
- `doctors://details/{doctor_id}` - Doctor profile

### Specialty Resources
- `specialties://list` - All specialties
- `specialties://doctors/{specialty_id}/{hospital_id}` - Doctors by specialty

### Medical Records Resources
- `medical_records://list/{hospital_id}` - Hospital records
- `medical_records://patient/{patient_id}` - Patient records

### Appointment Resources
- `appointments://today/{hospital_id}` - Today's appointments
- `appointments://upcoming/{hospital_id}` - Upcoming appointments

## Guided Prompts

Three guided prompts help with common workflows:

1. **Appointment Booking** - Step-by-step appointment scheduling
2. **Patient Onboarding** - New patient registration workflow
3. **Daily Operations** - Hospital daily operations checklist

## Key Improvements

### 1. Enhanced Data Models
- Fixed role filtering (using uppercase: 'DOCTOR', 'PATIENT', 'NURSE')
- Added prefetch_related for optimized queries
- Graceful error handling for missing relations

### 2. Comprehensive Filtering
- All list operations support multiple filter parameters
- Date range filtering for time-based queries
- Search capabilities for text fields

### 3. Statistics & Analytics
- Hospital statistics (doctor/patient counts)
- Doctor appointment statistics
- Specialty demand tracking

### 4. Error Handling
- Try-catch blocks for all database operations
- Meaningful error messages
- Success/failure response patterns

## Usage Example

```python
# Using the MCP client
from mcp_client import MCPClient

client = MCPClient("MedCor Healthcare MCP Server")

# Create a hospital
hospital = client.create_hospital(
    name="City Medical Center",
    subdomain="citymed",
    registration_number="REG123",
    email="admin@citymed.com",
    phone_number="+1234567890",
    address_line1="123 Main St",
    city="New York",
    state="NY",
    country="USA",
    postal_code="10001"
)

# List doctors with specialty
cardiologists = client.get_doctors_by_specialty(
    hospital_id=hospital['hospital_id'],
    specialty_id="cardiology_id"
)

# Create medical record
record = client.create_medical_record(
    hospital_id=hospital['hospital_id'],
    patient_id="patient_123",
    created_by_id="doctor_456",
    title="Annual Checkup",
    description="Regular health examination",
    record_type="CHECKUP"
)
```

## API Response Format

All tools return consistent JSON responses:

### Success Response
```json
{
    "success": true,
    "data": {...},
    "message": "Operation completed"
}
```

### Error Response
```json
{
    "success": false,
    "error": "Error description"
}
```

### List Response
```json
[
    {
        "id": "uuid",
        "name": "Item name",
        ...
    }
]
```

## Database Integration

The MCP server integrates with:
- PostgreSQL (via Django ORM)
- All Django models from medcor_backend2
- Multi-tenant architecture support

## Performance Optimizations

1. **Query Optimization**
   - Uses select_related for foreign keys
   - Uses prefetch_related for many-to-many
   - Limits query results (default: 20-100)

2. **Caching Strategy**
   - Frequently accessed data cached
   - Lazy loading for related objects

3. **Database Indexing**
   - Indexes on frequently queried fields
   - Composite indexes for complex queries

## Security

- Role-based access control
- Hospital isolation (multi-tenancy)
- Input validation on all parameters
- SQL injection prevention via ORM

## Testing

Run tests with:
```bash
python test_mcp_server.py
```

## Future Enhancements

1. WebSocket support for real-time updates
2. Batch operations for bulk data processing
3. Advanced analytics and reporting tools
4. Integration with external healthcare APIs
5. Audit logging for all operations

## Support

For issues or questions:
- Check Django logs: `medcor_backend2/logs/`
- MCP server logs: Console output
- Database queries: Django Debug Toolbar

## Version

Current Version: 2.0.0
- Added comprehensive specialty management
- Enhanced medical records functionality
- Improved doctor and hospital endpoints
- Added resource endpoints for REST access
- Implemented guided prompts