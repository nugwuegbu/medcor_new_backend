# Comprehensive MCP Server Integration with All MedCor Apps

## Overview

The Intelligent Query Processing endpoint now features **comprehensive MCP (Model Context Protocol) server integration** that can handle queries across ALL MedCor apps, not just medical records. This integration enables the system to intelligently process queries about hospitals, doctors, specialties, appointments, medical records, treatments, subscription plans, and more.

## Architecture

```
User Query → Intelligent Query Processing → MCP Server → Appropriate App Tool
     ↓                    ↓                    ↓              ↓
  Auto-detect      Query Type Detection    Tool Selection   Execution
  Query Type       (AI/Database/Medical)   (MCP Tools)     (Results)
```

## MedCor Apps Covered

### 🏥 **Tenants (Hospitals)**

- **Purpose**: Hospital management and multi-tenancy
- **MCP Tools**: `list_hospitals`, `get_hospital_details`, `create_hospital`, `update_hospital`
- **Query Examples**: "Show me all hospitals", "Get hospital details for ID 1"

### 👨‍⚕️ **Core (Users/Doctors)**

- **Purpose**: User and doctor management
- **MCP Tools**: `list_users`, `list_doctors`, `get_doctor_details`, `create_user`
- **Query Examples**: "List all doctors", "Show doctor details", "Create new user"

### 🏥 **Specialty**

- **Purpose**: Medical specialty management
- **MCP Tools**: `list_specialties`, `create_specialty`, `assign_doctor_specialty`, `list_doctor_specialties`
- **Query Examples**: "What specialties are available?", "Assign doctor to cardiology"

### 📅 **Appointments**

- **Purpose**: Appointment scheduling and management
- **MCP Tools**: `list_appointments`, `create_appointment`, `list_appointment_slots`, `update_appointment_status`
- **Query Examples**: "Book an appointment", "Show today's appointments", "List available slots"

### 📋 **Medical Records**

- **Purpose**: Patient medical record management
- **MCP Tools**: `list_medical_records`, `create_medical_record`, `get_medical_record_details`, `update_medical_record`
- **Query Examples**: "Show patient records", "Create new medical record", "Update diagnosis"

### 💊 **Treatments**

- **Purpose**: Treatment and prescription management
- **MCP Tools**: `list_treatments`, `create_treatment`
- **Query Examples**: "List all treatments", "Create treatment plan", "Show prescriptions"

### 💳 **Subscription Plans**

- **Purpose**: Subscription and billing management
- **MCP Tools**: `list_subscription_plans`, `create_subscription`
- **Query Examples**: "Show subscription plans", "Create new subscription", "List active plans"

### 🤖 **AI/Resources**

- **Purpose**: AI analysis, prompts, and resource access
- **MCP Tools**: `appointment_booking_prompt`, `patient_onboarding_prompt`, `daily_operations_prompt`
- **MCP Resources**: `get_hospitals_resource`, `get_doctors_resource`, `get_specialties_resource`
- **Query Examples**: "How does appointment booking work?", "Explain patient onboarding"

## Intelligent Query Processing

### Query Type Detection

The system automatically detects query types based on content analysis:

#### Database Query Indicators

```python
database_keywords = [
    "show me", "list", "find", "get", "select", "retrieve", "display",
    "patients with", "appointments", "records", "data", "table",
    "all patients", "today's", "this week", "last month",
    "count", "total", "statistics", "report",
    "book appointment", "available slots", "doctor availability",
    "patient", "user", "subscription plan", "medical record",
    "appointment", "slot", "specialty", "treatment", "prescription",
    "hospital", "tenant", "user profile", "doctor specialty",
    "subscription", "plan", "billing", "payment", "invoice",
    "doctor", "specialist", "nurse", "staff", "employee",
    "schedule", "calendar", "availability", "time slot",
    "patient record", "health record", "medical history",
    "treatment plan", "medication", "prescription", "dosage"
]
```

#### Medical Query Indicators

```python
medical_keywords = [
    "symptoms", "diagnosis", "treatment", "medicine", "drug", "therapy",
    "patient presents", "medical condition", "disease", "illness",
    "clinical", "pathology", "prognosis", "etiology", "complications",
    "side effects", "contraindications", "dosage", "prescription",
    "medical record", "health", "condition", "symptom"
]
```

#### AI Query Indicators

```python
ai_keywords = [
    "what is", "how to", "explain", "describe", "tell me about",
    "why", "when", "where", "who", "which", "can you",
    "help me understand", "difference between", "compare",
    "how does", "what are the benefits", "advantages", "disadvantages"
]
```

### MCP Tool Selection

The system intelligently selects MCP tools based on query content:

#### Database Queries

```python
# Appointment queries
if any(word in query_lower for word in ["appointment", "book", "schedule", "slot"]):
    if "list" in query_lower or "show" in query_lower:
        response = await mcp_client.call_tool("list_appointments", {"hospital_id": "1"})
    elif "slot" in query_lower or "available" in query_lower:
        response = await mcp_client.call_tool("list_appointment_slots", {"hospital_id": "1"})
    else:
        response = await mcp_client.call_tool("get_todays_appointments", {"hospital_id": "1"})

# Doctor queries
elif any(word in query_lower for word in ["doctor", "specialist", "physician"]):
    response = await mcp_client.call_tool("list_doctors", {"hospital_id": "1"})

# Hospital queries
elif any(word in query_lower for word in ["hospital", "tenant"]):
    response = await mcp_client.call_tool("list_hospitals", {})
```

#### Medical Queries

```python
# Medical record queries
if any(word in query_lower for word in ["medical record", "patient record", "health record"]):
    if "create" in query_lower or "add" in query_lower:
        response = await mcp_client.call_tool("create_medical_record", {...})
    else:
        response = await mcp_client.call_tool("list_medical_records", {"hospital_id": "1"})

# Treatment queries
elif any(word in query_lower for word in ["treatment", "prescription", "medication"]):
    response = await mcp_client.call_tool("create_treatment", {...})
```

#### AI Queries

```python
# Appointment booking prompts
if any(word in query_lower for word in ["appointment", "booking", "schedule"]):
    response = await mcp_client.call_tool("appointment_booking_prompt", {...})

# Hospital resources
elif any(word in query_lower for word in ["hospital", "facility", "clinic"]):
    response = await mcp_client.call_tool("get_hospitals_resource", {})
```

## API Endpoints

### `POST /api/ai/query/` - Comprehensive Intelligent Query Processing

**Description**: Single endpoint that automatically processes any type of query using MCP server tools across all MedCor apps.

**Request Body**:

```json
{
  "query": "Show me all doctors in hospital 1",
  "query_type": "auto",
  "use_celery": false,
  "database": "default"
}
```

**Response**:

```json
{
  "success": true,
  "message": "Query processed using list_doctors via MCP server",
  "result": "Database Query Result: [doctor data]",
  "query_type_detected": "database",
  "tool_used": "list_doctors",
  "processing_time": 1.2,
  "confidence": 0.85,
  "mcp_available": true
}
```

## MCP Server Tools

### Hospital Management Tools

- `create_hospital()` - Create new hospital
- `list_hospitals()` - List all hospitals
- `get_hospital_details(hospital_id)` - Get hospital details
- `update_hospital(hospital_id, ...)` - Update hospital information

### User/Doctor Management Tools

- `create_user()` - Create new user
- `list_users(hospital_id)` - List users in hospital
- `list_doctors(hospital_id)` - List doctors in hospital
- `get_doctor_details(doctor_id)` - Get doctor details

### Specialty Management Tools

- `list_specialties()` - List all specialties
- `create_specialty(code, name, description)` - Create new specialty
- `assign_doctor_specialty(doctor_id, specialty_id)` - Assign specialty to doctor
- `list_doctor_specialties(doctor_id)` - List doctor's specialties
- `get_doctors_by_specialty(hospital_id, specialty_id)` - Get doctors by specialty

### Appointment Management Tools

- `create_appointment(patient_id, doctor_id, hospital_id, ...)` - Create appointment
- `list_appointments(hospital_id, ...)` - List appointments
- `update_appointment_status(appointment_id, status)` - Update appointment status
- `list_appointment_slots(hospital_id)` - List available slots
- `get_todays_appointments(hospital_id)` - Get today's appointments

### Medical Record Tools

- `create_medical_record(patient_id, hospital_id, ...)` - Create medical record
- `list_medical_records(hospital_id, ...)` - List medical records
- `get_medical_record_details(record_id)` - Get record details
- `update_medical_record(record_id, ...)` - Update medical record

### Treatment Management Tools

- `create_treatment(patient_id, hospital_id, ...)` - Create treatment
- `list_treatments(hospital_id)` - List treatments

### Subscription Management Tools

- `list_subscription_plans(is_active)` - List subscription plans
- `create_subscription(patient_id, plan_id, ...)` - Create subscription

### AI/Resource Tools

- `appointment_booking_prompt(patient_name, hospital_name, query)` - Appointment booking prompt
- `patient_onboarding_prompt(hospital_name, patient_email)` - Patient onboarding prompt
- `daily_operations_prompt(hospital_id)` - Daily operations prompt

### MCP Resources

- `get_hospitals_resource()` - Hospital data resource
- `get_doctors_resource(hospital_id)` - Doctor data resource
- `get_specialties_resource()` - Specialty data resource
- `get_medical_records_resource(hospital_id)` - Medical records resource
- `get_todays_appointments(hospital_id)` - Today's appointments resource

## Usage Examples

### Example 1: Hospital Management

```bash
curl -X POST http://localhost:8000/api/ai/query/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"query": "Show me all hospitals in the system"}'
```

**MCP Tool Used**: `list_hospitals`
**Result**: List of all hospitals with details

### Example 2: Doctor Management

```bash
curl -X POST http://localhost:8000/api/ai/query/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"query": "List all doctors in hospital 1"}'
```

**MCP Tool Used**: `list_doctors`
**Result**: List of doctors in hospital 1

### Example 3: Appointment Booking

```bash
curl -X POST http://localhost:8000/api/ai/query/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"query": "Book an appointment for patient 1 with doctor 1"}'
```

**MCP Tool Used**: `create_appointment`
**Result**: Appointment created successfully

### Example 4: Medical Records

```bash
curl -X POST http://localhost:8000/api/ai/query/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"query": "Show me all medical records for patient 1"}'
```

**MCP Tool Used**: `get_patient_medical_records_resource`
**Result**: Patient's medical records

### Example 5: Treatment Management

```bash
curl -X POST http://localhost:8000/api/ai/query/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"query": "Create a new treatment plan for diabetes"}'
```

**MCP Tool Used**: `create_treatment`
**Result**: Treatment plan created

### Example 6: Subscription Management

```bash
curl -X POST http://localhost:8000/api/ai/query/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"query": "Show me all subscription plans"}'
```

**MCP Tool Used**: `list_subscription_plans`
**Result**: List of available subscription plans

### Example 7: AI Explanation

```bash
curl -X POST http://localhost:8000/api/ai/query/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"query": "How does the appointment booking system work?"}'
```

**MCP Tool Used**: `appointment_booking_prompt`
**Result**: AI-generated explanation using MCP prompts

## Benefits

### 🚀 **Comprehensive Coverage**

- **All Apps**: Covers every MedCor app (tenants, core, specialty, appointments, medical_records, treatments, subscription_plans)
- **Intelligent Routing**: Automatically selects the right tool for each query
- **Context Awareness**: Understands app-specific terminology and requirements

### 🎯 **Enhanced Capabilities**

- **Multi-App Queries**: Handle queries spanning multiple apps
- **Cross-App Operations**: Create relationships between different app entities
- **Unified Interface**: Single endpoint for all app operations

### ⚡ **Better Performance**

- **Tool Selection**: Automatic selection of optimal MCP tools
- **Caching**: Results cached for improved response times
- **Background Processing**: Long-running operations don't block API

### 🔧 **Developer Experience**

- **Single Endpoint**: One API for all app operations
- **Comprehensive Documentation**: OpenAPI/Swagger integration
- **Error Handling**: Detailed error messages and status codes

## Future Enhancements

- **Cross-App Workflows**: Multi-step operations across apps
- **Custom App Tools**: User-defined tools for specific use cases
- **Advanced Analytics**: Query pattern analysis across all apps
- **Real-time Updates**: Live data synchronization across apps
- **Custom Prompts**: App-specific prompts and templates

---

Visit the [Swagger Documentation](http://localhost:8000/api/docs/) for interactive API testing and complete schema details.
