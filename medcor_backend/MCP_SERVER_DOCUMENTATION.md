# 🏥 MedCor Healthcare MCP Server Documentation

## Overview

The MedCor Healthcare MCP Server provides comprehensive programmatic access to all healthcare management functions through the Model Context Protocol (MCP). This server acts as a bridge between MCP clients and the Django REST API backend, offering standardized tools for healthcare operations.

## Server Architecture

### Files Structure
```
medcor_backend/
├── mcp_server_updated.py       # Main MCP server implementation
├── mcp_server.py              # Legacy version (deprecated)
├── run_mcp_server.py          # Server runner script
└── MCP_SERVER_DOCUMENTATION.md # This documentation
```

### Technical Stack
- **Protocol**: Model Context Protocol (MCP)
- **Framework**: FastMCP (with enhanced mock fallback)
- **Backend Integration**: Django REST API (port 8000)
- **Authentication**: JWT Bearer tokens
- **Multi-tenancy**: Full tenant isolation support

## Available Tools (33)

### 🏢 Tenant Management (5 tools)
- `list_tenants()` - List all available tenants (hospitals/clinics)
- `get_tenant_details(tenant_id)` - Get detailed tenant information
- `create_tenant(name, schema_name, description, contact_email)` - Create new tenant
- `list_tenant_domains()` - List all tenant domains
- `create_tenant_domain(domain, tenant_id, is_primary)` - Create tenant domain

### 👥 User Management (7 tools)
- `list_doctors(tenant_id?)` - List doctors with optional tenant filtering
- `get_doctor_details(doctor_id)` - Get detailed doctor information
- `create_doctor(email, first_name, last_name, specialization, tenant_id?)` - Create doctor account
- `list_patients(tenant_id?)` - List patients with optional tenant filtering
- `get_patient_details(patient_id)` - Get detailed patient information
- `create_patient(email, first_name, last_name, phone_number?, tenant_id?)` - Create patient account
- `list_nurses(tenant_id?)` - List nurses with optional tenant filtering

### 📅 Appointment Management (6 tools)
- `list_appointments(tenant_id?, status?)` - List appointments with filtering
- `get_appointment_details(appointment_id)` - Get detailed appointment information
- `create_appointment(patient_id, doctor_id, treatment_id, appointment_date, appointment_time, notes?, tenant_id?)` - Create new appointment
- `update_appointment_status(appointment_id, status)` - Update appointment status
- `list_appointment_slots(doctor_id?, date?)` - List available appointment slots
- `create_appointment_slot(doctor_id, day_of_week, start_time, end_time)` - Create appointment slot

### 💊 Treatment Management (5 tools)
- `list_treatments(tenant_id?, search?)` - List treatments with filtering
- `get_treatment_details(treatment_id)` - Get detailed treatment information
- `create_treatment(name, description, cost, tenant_id)` - Create new treatment
- `update_treatment(treatment_id, name?, description?, cost?)` - Update existing treatment
- `get_treatment_stats(tenant_id?)` - Get treatment statistics

### 💳 Subscription Management (5 tools)
- `list_subscription_plans()` - List all available subscription plans
- `get_subscription_plan_details(plan_id)` - Get detailed plan information
- `create_subscription_plan(name, price, billing_cycle, features)` - Create new subscription plan
- `list_subscriptions(tenant_id?)` - List subscriptions with optional tenant filtering
- `create_subscription(tenant_id, plan_id)` - Create new subscription for tenant

### 🔐 Authentication (3 tools)
- `admin_login(username, password)` - Authenticate admin user and get JWT token
- `get_admin_profile(token)` - Get admin user profile information
- `list_all_users(token)` - List all users in system (admin only)

### 🔧 System Health & Analytics (2 tools)
- `health_check()` - Check system health and API availability
- `get_system_stats()` - Get comprehensive system statistics

## Available Resources (3)

### 📖 API Documentation
- **URI**: `healthcare://api/documentation`
- **Description**: Comprehensive API documentation with endpoints, authentication details, and usage examples

### 🏥 Tenant List
- **URI**: `healthcare://tenants/list`
- **Description**: Current list of all tenants with real-time data

### 📊 System Status
- **URI**: `healthcare://system/status`
- **Description**: Current system status, health checks, and comprehensive statistics

## Available Prompts (3)

### 📅 Appointment Scheduling
- **Name**: `schedule_appointment`
- **Description**: Guided workflow for scheduling appointments with step-by-step instructions

### 🏢 Tenant Setup
- **Name**: `tenant_setup`
- **Description**: Comprehensive guide for setting up new hospital or clinic tenants

### 🔧 System Maintenance
- **Name**: `system_maintenance`
- **Description**: System maintenance and monitoring assistant with health check procedures

## Usage Examples

### Basic Health Check
```python
# Check if the system is running
result = health_check()
print(result)  # {"status": "ok", "message": "Django backend is running"}
```

### List All Tenants
```python
# Get all available tenants
tenants = list_tenants()
for tenant in tenants.get("results", []):
    print(f"Tenant: {tenant['name']} (Schema: {tenant['schema_name']})")
```

### Create New Appointment
```python
# Schedule an appointment
appointment = create_appointment(
    patient_id=1,
    doctor_id=2,
    treatment_id=3,
    appointment_date="2025-01-15",
    appointment_time="10:00",
    notes="Follow-up consultation",
    tenant_id=1
)
```

### Multi-tenant Operations
```python
# List doctors for specific tenant
hospital_doctors = list_doctors(tenant_id=1)
clinic_doctors = list_doctors(tenant_id=2)

# Create tenant-specific treatment
treatment = create_treatment(
    name="Dental Cleaning",
    description="Professional dental cleaning service",
    cost=150.00,
    tenant_id=1
)
```

## Authentication

### JWT Token Authentication
Most administrative operations require JWT authentication:

```python
# Login and get token
auth_result = admin_login("admin", "admin123")
token = auth_result.get("access_token")

# Use token for authenticated requests
profile = get_admin_profile(token)
users = list_all_users(token)
```

### Role-based Access Control
- **Admin**: Full system access, user management, statistics
- **Doctor**: Patient management, appointment scheduling, treatment access
- **Patient**: Appointment booking, personal information access
- **Nurse**: Patient care, appointment assistance

## Multi-tenant Architecture

### Tenant Isolation
All tools support tenant-specific operations with complete data isolation:

- **Tenant-specific filtering**: Most list operations accept optional `tenant_id` parameter
- **Data isolation**: Each tenant has separate database schema
- **Domain routing**: Tenants can have custom domains and subdomains
- **Independent configuration**: Each tenant can have custom branding and settings

### Tenant Context
```python
# Operations can be tenant-specific
hospital_patients = list_patients(tenant_id=1)  # Hospital A patients
clinic_patients = list_patients(tenant_id=2)    # Clinic B patients

# Cross-tenant operations (admin only)
all_patients = list_patients()  # All patients across tenants
```

## Error Handling

The MCP server includes comprehensive error handling:

- **API Request Failures**: Network errors, timeouts, and connection issues
- **Authentication Errors**: Invalid tokens, expired sessions
- **Validation Errors**: Invalid data, missing required fields
- **Tenant Access Errors**: Unauthorized tenant access, schema not found

### Error Response Format
```json
{
    "error": "Description of the error",
    "details": "Additional error context (when available)"
}
```

## Performance Considerations

### Request Optimization
- **Batch Operations**: Use list operations instead of multiple individual requests
- **Filtering**: Apply tenant and status filters to reduce data transfer
- **Caching**: Resource endpoints cache data for improved performance

### Rate Limiting
- No explicit rate limiting implemented
- Django backend handles concurrent requests efficiently
- Consider implementing rate limiting for production deployments

## Development and Testing

### Running the Server
```bash
# Start the MCP server
cd medcor_backend
python run_mcp_server.py
```

### Testing Tools
```bash
# Test individual tools
python -c "
from mcp_server_updated import health_check
print(health_check())
"

# Test authentication flow
python -c "
from mcp_server_updated import admin_login, get_admin_profile
token_result = admin_login('admin', 'admin123')
if 'access_token' in token_result:
    profile = get_admin_profile(token_result['access_token'])
    print(profile)
"
```

### Mock Mode
When FastMCP is not available, the server runs in enhanced mock mode:
- All tools are registered and available
- Comprehensive logging of operations
- Detailed tool and resource listings
- Same API interface as full MCP mode

## Production Deployment

### Requirements
- FastMCP package for production deployment
- Django backend running on accessible port
- Proper SSL certificates for secure connections
- JWT secret key configuration

### Configuration
```python
# Update API_BASE_URL for production
API_BASE_URL = "https://your-domain.com:8000"

# Configure proper authentication
DEFAULT_HEADERS = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
}
```

### Security Considerations
- Use HTTPS for all API communications
- Implement proper JWT token management
- Configure appropriate CORS settings
- Enable proper authentication and authorization
- Regular security audits and updates

## Support and Maintenance

### Monitoring
- Use `health_check()` for regular system health monitoring
- Monitor `get_system_stats()` for performance metrics
- Track API response times and error rates

### Updates
- Server automatically reflects Django API changes
- New tools can be added by extending the tool functions
- Resource endpoints update automatically with backend changes

### Troubleshooting
1. **Server won't start**: Check Django environment configuration
2. **API calls failing**: Verify Django backend is running on port 8000
3. **Authentication issues**: Confirm JWT token validity and permissions
4. **Tenant access problems**: Verify tenant exists and user has proper access

## Version History

- **v1.0** (Legacy): Basic healthcare management tools
- **v2.0** (Current): Comprehensive API coverage, multi-tenant support, enhanced error handling
- **Future**: FastMCP optimization, advanced analytics, real-time notifications

For technical support and feature requests, refer to the project documentation or contact the development team.