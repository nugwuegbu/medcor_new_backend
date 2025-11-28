# MCP (Model Context Protocol) Server - Complete Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [SSE (Server-Sent Events) Integration](#sse-integration)
4. [Authentication](#authentication)
5. [Complete Tools Reference](#complete-tools-reference)
6. [Resources Reference](#resources-reference)
7. [Prompts Reference](#prompts-reference)
8. [Usage Examples](#usage-examples)
9. [WebSocket Alternative](#websocket-alternative)
10. [Error Handling](#error-handling)

## Overview

The MedCor MCP Server is a comprehensive healthcare management interface that provides programmatic access to all healthcare operations through a standardized protocol. It supports both direct tool invocation and SSE streaming for real-time updates.

### Key Features
- **40+ Healthcare Tools**: Complete CRUD operations for all entities
- **10+ REST Resources**: RESTful endpoints for data access
- **3 Guided Prompts**: Interactive workflows for common tasks
- **Multi-tenant Support**: Hospital-based data isolation
- **Real-time Updates**: SSE streaming for live data changes
- **Role-based Access**: JWT authentication with role enforcement

## Architecture

```
┌─────────────────────────────────────────────────┐
│                 Client Application               │
├─────────────────────────────────────────────────┤
│          SSE Client / WebSocket Client           │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│              MCP Server (FastMCP)                │
├─────────────────────────────────────────────────┤
│  • Authentication Layer (JWT)                    │
│  • Tool Registry (40+ tools)                     │
│  • Resource Handlers (10+ endpoints)             │
│  • SSE Event Emitter                            │
│  • Database ORM (Django Models)                  │
└─────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│           PostgreSQL Database                    │
└─────────────────────────────────────────────────┘
```

## SSE (Server-Sent Events) Integration

### SSE Endpoint
```
GET /api/mcp/sse
```

### Connection Setup

#### JavaScript/TypeScript Client
```javascript
// Initialize SSE connection with authentication
const initSSEConnection = (token) => {
  const eventSource = new EventSource('/api/mcp/sse', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  // Handle different event types
  eventSource.addEventListener('tool_response', (event) => {
    const data = JSON.parse(event.data);
    console.log('Tool response:', data);
  });

  eventSource.addEventListener('resource_update', (event) => {
    const data = JSON.parse(event.data);
    console.log('Resource updated:', data);
  });

  eventSource.addEventListener('error_event', (event) => {
    const data = JSON.parse(event.data);
    console.error('Error:', data);
  });

  eventSource.onerror = (error) => {
    console.error('SSE connection error:', error);
    // Implement reconnection logic
  };

  return eventSource;
};
```

#### Python Client
```python
import sseclient
import requests
import json

def connect_sse(token):
    """Connect to MCP SSE endpoint"""
    headers = {'Authorization': f'Bearer {token}'}
    response = requests.get(
        'http://localhost:8002/api/mcp/sse',
        headers=headers,
        stream=True
    )
    
    client = sseclient.SSEClient(response)
    
    for event in client.events():
        if event.event == 'tool_response':
            data = json.loads(event.data)
            handle_tool_response(data)
        elif event.event == 'resource_update':
            data = json.loads(event.data)
            handle_resource_update(data)
        elif event.event == 'error_event':
            data = json.loads(event.data)
            handle_error(data)
```

### SSE Event Types

| Event Type | Description | Payload Structure |
|------------|-------------|-------------------|
| `tool_response` | Response from tool execution | `{tool: string, result: any, timestamp: string}` |
| `resource_update` | Resource data change notification | `{resource: string, action: string, data: any}` |
| `error_event` | Error during operation | `{error: string, details: any, timestamp: string}` |
| `heartbeat` | Keep-alive signal | `{timestamp: string}` |
| `auth_refresh` | Token refresh notification | `{new_token: string, expires_at: string}` |

## Authentication

### JWT Token Structure
```json
{
  "user_id": "uuid",
  "email": "user@example.com",
  "role": "DOCTOR|PATIENT|NURSE|ADMIN",
  "hospital_id": "uuid",
  "exp": 1234567890,
  "iat": 1234567890
}
```

### Authentication Flow
```javascript
// 1. Login to get JWT token
const login = async (email, password) => {
  const response = await fetch('/api/auth/login/', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({email, password})
  });
  const data = await response.json();
  return data.access_token;
};

// 2. Use token for MCP operations
const callMCPTool = async (token, tool, params) => {
  const response = await fetch('/api/mcp/tools/invoke', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({tool, params})
  });
  return await response.json();
};
```

## Complete Tools Reference

### Hospital Management Tools

#### list_hospitals
List all hospitals in the system.
```javascript
{
  tool: "list_hospitals",
  params: {
    search: "General",  // Optional
    is_active: true     // Optional
  }
}
```

#### get_hospital
Get detailed hospital information.
```javascript
{
  tool: "get_hospital",
  params: {
    hospital_id: "uuid"
  }
}
```

#### create_hospital
Create a new hospital (admin only).
```javascript
{
  tool: "create_hospital",
  params: {
    name: "New Hospital",
    subdomain: "newhospital",
    registration_number: "REG123",
    email: "admin@newhospital.com",
    phone_number: "+1-555-0000",
    address_line1: "123 Medical St",
    city: "New York",
    state: "NY",
    country: "USA",
    postal_code: "10001",
    hospital_type: "General"
  }
}
```

#### update_hospital
Update hospital information.
```javascript
{
  tool: "update_hospital",
  params: {
    hospital_id: "uuid",
    name: "Updated Name",
    phone_number: "+1-555-1111"
  }
}
```

#### delete_hospital
Deactivate a hospital.
```javascript
{
  tool: "delete_hospital",
  params: {
    hospital_id: "uuid"
  }
}
```

### User Management Tools

#### list_users
List users with optional role filtering.
```javascript
{
  tool: "list_users",
  params: {
    role: "DOCTOR",  // Optional: DOCTOR, PATIENT, NURSE, ADMIN
    hospital_id: "uuid",  // Optional
    is_active: true  // Optional
  }
}
```

#### get_user
Get detailed user information.
```javascript
{
  tool: "get_user",
  params: {
    user_id: "uuid"
  }
}
```

#### create_user
Create a new user account.
```javascript
{
  tool: "create_user",
  params: {
    email: "newuser@example.com",
    password: "SecurePass123!",
    first_name: "John",
    last_name: "Doe",
    role: "PATIENT",
    hospital_id: "uuid",
    phone_number: "+1-555-2222",
    date_of_birth: "1990-01-01",  // For patients
    license_number: "MD12345",     // For doctors
    years_of_experience: 10        // For doctors
  }
}
```

#### update_user
Update user information.
```javascript
{
  tool: "update_user",
  params: {
    user_id: "uuid",
    first_name: "Updated",
    phone_number: "+1-555-3333"
  }
}
```

#### delete_user
Deactivate a user account.
```javascript
{
  tool: "delete_user",
  params: {
    user_id: "uuid"
  }
}
```

### Doctor Tools

#### list_doctors
List all doctors with filtering options.
```javascript
{
  tool: "list_doctors",
  params: {
    hospital_id: "uuid",  // Optional
    specialty: "Cardiology",  // Optional
    is_available: true  // Optional
  }
}
```

#### get_doctor_details
Get comprehensive doctor information including specialties.
```javascript
{
  tool: "get_doctor_details",
  params: {
    doctor_id: "uuid"
  }
}
```

#### update_doctor_specialties
Update doctor's specialty associations.
```javascript
{
  tool: "update_doctor_specialties",
  params: {
    doctor_id: "uuid",
    specialties: [
      {
        specialty_id: "uuid",
        is_primary: true,
        years_of_experience: 10,
        certification_date: "2015-01-01"
      }
    ]
  }
}
```

### Specialty Tools

#### list_specialties
List all medical specialties.
```javascript
{
  tool: "list_specialties",
  params: {
    search: "Cardio",  // Optional
    is_active: true  // Optional
  }
}
```

#### create_specialty
Create a new medical specialty.
```javascript
{
  tool: "create_specialty",
  params: {
    code: "NEWSPEC",
    name: "New Specialty",
    description: "Description of specialty"
  }
}
```

#### get_specialty_doctors
Get all doctors with a specific specialty.
```javascript
{
  tool: "get_specialty_doctors",
  params: {
    specialty_id: "uuid",
    hospital_id: "uuid"  // Optional
  }
}
```

### Appointment Tools

#### list_appointments
List appointments with filtering.
```javascript
{
  tool: "list_appointments",
  params: {
    patient_id: "uuid",  // Optional
    doctor_id: "uuid",   // Optional
    status: "SCHEDULED",  // Optional: SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
    date_from: "2025-01-01",  // Optional
    date_to: "2025-12-31"     // Optional
  }
}
```

#### create_appointment
Schedule a new appointment.
```javascript
{
  tool: "create_appointment",
  params: {
    patient_id: "uuid",
    doctor_id: "uuid",
    appointment_date: "2025-02-01",
    appointment_time: "14:00:00",
    reason: "Regular checkup",
    notes: "Patient has allergies"
  }
}
```

#### update_appointment_status
Update appointment status.
```javascript
{
  tool: "update_appointment_status",
  params: {
    appointment_id: "uuid",
    status: "COMPLETED",
    notes: "Appointment completed successfully"
  }
}
```

#### list_appointment_slots
Get available appointment slots for a doctor.
```javascript
{
  tool: "list_appointment_slots",
  params: {
    doctor_id: "uuid",
    date: "2025-02-01"
  }
}
```

### Medical Record Tools

#### list_medical_records
List patient medical records.
```javascript
{
  tool: "list_medical_records",
  params: {
    patient_id: "uuid",
    record_type: "CONSULTATION",  // Optional
    date_from: "2024-01-01",  // Optional
    date_to: "2024-12-31"     // Optional
  }
}
```

#### get_medical_record
Get detailed medical record.
```javascript
{
  tool: "get_medical_record",
  params: {
    record_id: "uuid"
  }
}
```

#### create_medical_record
Create a new medical record.
```javascript
{
  tool: "create_medical_record",
  params: {
    patient_id: "uuid",
    title: "Annual Checkup",
    description: "Routine health examination",
    record_type: "CHECKUP",
    diagnosis: "Patient in good health",
    symptoms: "None",
    attachments: ["file_url1", "file_url2"]  // Optional
  }
}
```

#### update_medical_record
Update existing medical record.
```javascript
{
  tool: "update_medical_record",
  params: {
    record_id: "uuid",
    diagnosis: "Updated diagnosis",
    treatment_plan: "New treatment approach"
  }
}
```

### Treatment Tools

#### list_treatments
List patient treatments.
```javascript
{
  tool: "list_treatments",
  params: {
    patient_id: "uuid",
    doctor_id: "uuid",  // Optional
    status: "ACTIVE"    // Optional: ACTIVE, COMPLETED, DISCONTINUED
  }
}
```

#### create_treatment
Create a new treatment plan.
```javascript
{
  tool: "create_treatment",
  params: {
    patient_id: "uuid",
    doctor_id: "uuid",
    name: "Hypertension Management",
    description: "Blood pressure control treatment",
    medications: [
      {
        name: "Lisinopril",
        dosage: "10mg",
        frequency: "Once daily",
        duration: "3 months"
      }
    ],
    instructions: "Monitor blood pressure daily",
    follow_up_date: "2025-03-01"
  }
}
```

#### update_treatment
Update treatment plan.
```javascript
{
  tool: "update_treatment",
  params: {
    treatment_id: "uuid",
    status: "COMPLETED",
    notes: "Treatment completed successfully"
  }
}
```

### Subscription Tools

#### list_subscription_plans
List available subscription plans.
```javascript
{
  tool: "list_subscription_plans",
  params: {
    plan_type: "PROFESSIONAL",  // Optional: BASIC, PROFESSIONAL, ENTERPRISE
    is_active: true  // Optional
  }
}
```

#### create_subscription
Create a new subscription for a hospital.
```javascript
{
  tool: "create_subscription",
  params: {
    hospital_id: "uuid",
    plan_id: "uuid",
    start_date: "2025-01-01",
    billing_cycle: "MONTHLY"  // MONTHLY, QUARTERLY, ANNUAL
  }
}
```

#### update_subscription
Update subscription details.
```javascript
{
  tool: "update_subscription",
  params: {
    subscription_id: "uuid",
    plan_id: "new_plan_uuid",
    auto_renew: true
  }
}
```

#### cancel_subscription
Cancel a subscription.
```javascript
{
  tool: "cancel_subscription",
  params: {
    subscription_id: "uuid",
    reason: "Switching to different plan",
    immediate: false  // If true, cancels immediately; if false, at period end
  }
}
```

### Analytics Tools

#### get_hospital_statistics
Get comprehensive hospital statistics.
```javascript
{
  tool: "get_hospital_statistics",
  params: {
    hospital_id: "uuid",
    date_from: "2025-01-01",
    date_to: "2025-01-31"
  }
}
// Returns: patient count, doctor count, appointments, revenue, etc.
```

#### get_doctor_performance
Get doctor performance metrics.
```javascript
{
  tool: "get_doctor_performance",
  params: {
    doctor_id: "uuid",
    period: "MONTHLY"  // DAILY, WEEKLY, MONTHLY, YEARLY
  }
}
// Returns: appointments completed, patients seen, average rating, etc.
```

#### get_specialty_demand
Analyze specialty demand patterns.
```javascript
{
  tool: "get_specialty_demand",
  params: {
    hospital_id: "uuid",
    period: "QUARTERLY"
  }
}
// Returns: appointments by specialty, wait times, utilization rates
```

## Resources Reference

### REST Resource Endpoints

Resources provide RESTful access to data without tool invocation.

#### hospitals
```
GET /api/mcp/resources/hospitals
GET /api/mcp/resources/hospitals/{id}
```

#### users
```
GET /api/mcp/resources/users
GET /api/mcp/resources/users/{id}
```

#### doctors
```
GET /api/mcp/resources/doctors
GET /api/mcp/resources/doctors/{id}
```

#### patients
```
GET /api/mcp/resources/patients
GET /api/mcp/resources/patients/{id}
```

#### appointments
```
GET /api/mcp/resources/appointments
GET /api/mcp/resources/appointments/{id}
```

#### medical_records
```
GET /api/mcp/resources/medical_records
GET /api/mcp/resources/medical_records/{id}
```

#### treatments
```
GET /api/mcp/resources/treatments
GET /api/mcp/resources/treatments/{id}
```

#### specialties
```
GET /api/mcp/resources/specialties
GET /api/mcp/resources/specialties/{id}
```

#### subscription_plans
```
GET /api/mcp/resources/subscription_plans
GET /api/mcp/resources/subscription_plans/{id}
```

#### analytics
```
GET /api/mcp/resources/analytics/dashboard
GET /api/mcp/resources/analytics/reports
```

### Resource Query Parameters

All resource endpoints support standard query parameters:

| Parameter | Description | Example |
|-----------|-------------|---------|
| `page` | Page number for pagination | `?page=2` |
| `limit` | Items per page (max 100) | `?limit=20` |
| `sort` | Sort field and order | `?sort=-created_at` |
| `filter` | JSON filter object | `?filter={"role":"DOCTOR"}` |
| `fields` | Comma-separated fields to return | `?fields=id,name,email` |
| `expand` | Expand related objects | `?expand=hospital,specialties` |

## Prompts Reference

### Guided Prompts

The MCP server provides interactive prompts for common workflows.

#### appointment_booking
Interactive appointment booking workflow.
```javascript
{
  prompt: "appointment_booking",
  initial_data: {
    patient_id: "uuid",  // Optional, can be determined during flow
    preferred_date: "2025-02-01"  // Optional
  }
}
```

**Flow:**
1. Select or identify patient
2. Choose medical concern/specialty
3. Select preferred doctor or let system recommend
4. Pick available date and time
5. Confirm appointment details
6. Send confirmation

#### patient_onboarding
New patient registration and setup.
```javascript
{
  prompt: "patient_onboarding",
  initial_data: {
    hospital_id: "uuid",
    referral_source: "website"  // Optional
  }
}
```

**Flow:**
1. Collect basic information (name, email, phone)
2. Gather medical history
3. Insurance information (if applicable)
4. Consent forms
5. Create patient account
6. Schedule initial appointment

#### emergency_triage
Emergency patient triage workflow.
```javascript
{
  prompt: "emergency_triage",
  initial_data: {
    symptoms: ["chest pain", "shortness of breath"]
  }
}
```

**Flow:**
1. Assess symptom severity
2. Determine urgency level
3. Assign to appropriate department
4. Notify relevant medical staff
5. Create preliminary medical record
6. Track patient status

## Usage Examples

### Complete Example: Appointment Booking with SSE

```javascript
class MCPClient {
  constructor(token) {
    this.token = token;
    this.eventSource = null;
    this.initSSE();
  }

  initSSE() {
    this.eventSource = new EventSource('/api/mcp/sse', {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });

    this.eventSource.addEventListener('tool_response', (event) => {
      this.handleToolResponse(JSON.parse(event.data));
    });
  }

  async bookAppointment(patientId, doctorId, date, time) {
    // 1. Check doctor availability
    const slotsResponse = await this.invokeTool('list_appointment_slots', {
      doctor_id: doctorId,
      date: date
    });

    if (!this.isSlotAvailable(slotsResponse, time)) {
      throw new Error('Selected time slot not available');
    }

    // 2. Create appointment
    const appointmentResponse = await this.invokeTool('create_appointment', {
      patient_id: patientId,
      doctor_id: doctorId,
      appointment_date: date,
      appointment_time: time,
      reason: 'Regular checkup'
    });

    // 3. Create medical record placeholder
    await this.invokeTool('create_medical_record', {
      patient_id: patientId,
      title: `Appointment - ${date}`,
      description: 'Scheduled appointment',
      record_type: 'APPOINTMENT'
    });

    return appointmentResponse;
  }

  async invokeTool(tool, params) {
    const response = await fetch('/api/mcp/tools/invoke', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({tool, params})
    });
    return await response.json();
  }

  handleToolResponse(data) {
    console.log('Tool response received:', data);
    // Update UI or trigger actions based on response
  }

  isSlotAvailable(slots, time) {
    return slots.available_times.includes(time);
  }

  close() {
    if (this.eventSource) {
      this.eventSource.close();
    }
  }
}

// Usage
const client = new MCPClient(authToken);
try {
  const appointment = await client.bookAppointment(
    'patient-uuid',
    'doctor-uuid',
    '2025-02-01',
    '14:00:00'
  );
  console.log('Appointment booked:', appointment);
} finally {
  client.close();
}
```

### Complete Example: Real-time Dashboard with SSE

```javascript
class HealthcareDashboard {
  constructor(token, hospitalId) {
    this.token = token;
    this.hospitalId = hospitalId;
    this.stats = {};
    this.initSSE();
    this.loadInitialData();
  }

  initSSE() {
    const eventSource = new EventSource('/api/mcp/sse', {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });

    // Listen for real-time updates
    eventSource.addEventListener('resource_update', (event) => {
      const update = JSON.parse(event.data);
      this.handleResourceUpdate(update);
    });

    eventSource.addEventListener('appointment_created', (event) => {
      const appointment = JSON.parse(event.data);
      this.updateAppointmentStats(appointment);
    });

    eventSource.addEventListener('patient_registered', (event) => {
      const patient = JSON.parse(event.data);
      this.updatePatientCount(patient);
    });
  }

  async loadInitialData() {
    // Load hospital statistics
    const statsResponse = await fetch('/api/mcp/tools/invoke', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tool: 'get_hospital_statistics',
        params: {
          hospital_id: this.hospitalId,
          date_from: this.getMonthStart(),
          date_to: this.getToday()
        }
      })
    });

    this.stats = await statsResponse.json();
    this.renderDashboard();
  }

  handleResourceUpdate(update) {
    switch(update.resource) {
      case 'appointments':
        this.updateAppointmentDisplay(update.data);
        break;
      case 'patients':
        this.updatePatientDisplay(update.data);
        break;
      case 'doctors':
        this.updateDoctorDisplay(update.data);
        break;
    }
  }

  updateAppointmentStats(appointment) {
    this.stats.todayAppointments++;
    this.renderAppointmentWidget();
  }

  updatePatientCount(patient) {
    this.stats.totalPatients++;
    this.renderPatientWidget();
  }

  renderDashboard() {
    // Render complete dashboard
    document.getElementById('dashboard').innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <h3>Total Patients</h3>
          <p>${this.stats.totalPatients}</p>
        </div>
        <div class="stat-card">
          <h3>Today's Appointments</h3>
          <p>${this.stats.todayAppointments}</p>
        </div>
        <div class="stat-card">
          <h3>Active Doctors</h3>
          <p>${this.stats.activeDoctors}</p>
        </div>
        <div class="stat-card">
          <h3>Revenue This Month</h3>
          <p>$${this.stats.monthlyRevenue}</p>
        </div>
      </div>
    `;
  }

  getMonthStart() {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().split('T')[0];
  }

  getToday() {
    return new Date().toISOString().split('T')[0];
  }
}

// Initialize dashboard
const dashboard = new HealthcareDashboard(authToken, hospitalId);
```

### Python Example: Batch Operations with SSE

```python
import asyncio
import aiohttp
import json
from typing import List, Dict, Any

class MCPBatchProcessor:
    """Process batch operations through MCP with SSE monitoring"""
    
    def __init__(self, base_url: str, token: str):
        self.base_url = base_url
        self.token = token
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
    
    async def batch_create_patients(self, patients: List[Dict[str, Any]]):
        """Create multiple patients with progress monitoring"""
        
        async with aiohttp.ClientSession() as session:
            # Start SSE connection for monitoring
            sse_task = asyncio.create_task(
                self.monitor_sse(session)
            )
            
            results = []
            for patient in patients:
                result = await self.invoke_tool(
                    session,
                    'create_user',
                    {
                        **patient,
                        'role': 'PATIENT'
                    }
                )
                results.append(result)
                
                # Small delay to avoid overwhelming the server
                await asyncio.sleep(0.1)
            
            # Cancel SSE monitoring
            sse_task.cancel()
            
            return results
    
    async def invoke_tool(self, session: aiohttp.ClientSession, 
                         tool: str, params: Dict[str, Any]):
        """Invoke an MCP tool"""
        
        async with session.post(
            f'{self.base_url}/api/mcp/tools/invoke',
            headers=self.headers,
            json={'tool': tool, 'params': params}
        ) as response:
            return await response.json()
    
    async def monitor_sse(self, session: aiohttp.ClientSession):
        """Monitor SSE events for real-time updates"""
        
        async with session.get(
            f'{self.base_url}/api/mcp/sse',
            headers={'Authorization': f'Bearer {self.token}'}
        ) as response:
            async for line in response.content:
                if line.startswith(b'data: '):
                    try:
                        data = json.loads(line[6:].decode('utf-8'))
                        await self.handle_sse_event(data)
                    except json.JSONDecodeError:
                        continue
    
    async def handle_sse_event(self, event: Dict[str, Any]):
        """Handle SSE events"""
        
        if event.get('type') == 'tool_response':
            print(f"Tool completed: {event['tool']}")
        elif event.get('type') == 'error_event':
            print(f"Error: {event['error']}")
    
    async def bulk_schedule_appointments(self, appointments: List[Dict]):
        """Schedule multiple appointments efficiently"""
        
        async with aiohttp.ClientSession() as session:
            # First, get all doctor availability
            tasks = []
            for apt in appointments:
                task = self.invoke_tool(
                    session,
                    'list_appointment_slots',
                    {
                        'doctor_id': apt['doctor_id'],
                        'date': apt['date']
                    }
                )
                tasks.append(task)
            
            availabilities = await asyncio.gather(*tasks)
            
            # Schedule appointments based on availability
            scheduled = []
            for apt, availability in zip(appointments, availabilities):
                if self.find_available_slot(availability, apt['preferred_time']):
                    result = await self.invoke_tool(
                        session,
                        'create_appointment',
                        apt
                    )
                    scheduled.append(result)
            
            return scheduled
    
    def find_available_slot(self, availability: Dict, preferred_time: str):
        """Check if preferred time is available"""
        
        return preferred_time in availability.get('available_times', [])

# Usage example
async def main():
    processor = MCPBatchProcessor('http://localhost:8002', auth_token)
    
    # Batch create patients
    patients = [
        {
            'email': f'patient{i}@example.com',
            'password': 'SecurePass123!',
            'first_name': f'Patient{i}',
            'last_name': 'Test',
            'hospital_id': hospital_id,
            'date_of_birth': '1990-01-01'
        }
        for i in range(10)
    ]
    
    results = await processor.batch_create_patients(patients)
    print(f"Created {len(results)} patients")
    
    # Bulk schedule appointments
    appointments = [
        {
            'patient_id': patient_id,
            'doctor_id': doctor_id,
            'date': '2025-02-01',
            'preferred_time': '14:00:00',
            'reason': 'Checkup'
        }
        for patient_id in patient_ids
    ]
    
    scheduled = await processor.bulk_schedule_appointments(appointments)
    print(f"Scheduled {len(scheduled)} appointments")

# Run the async main function
asyncio.run(main())
```

## WebSocket Alternative

For bidirectional communication, WebSocket support is also available:

### WebSocket Endpoint
```
ws://localhost:8002/api/mcp/ws
```

### WebSocket Client Example
```javascript
class MCPWebSocketClient {
  constructor(token) {
    this.token = token;
    this.ws = null;
    this.callbacks = new Map();
    this.connect();
  }

  connect() {
    this.ws = new WebSocket('ws://localhost:8002/api/mcp/ws');
    
    this.ws.onopen = () => {
      // Authenticate after connection
      this.send({
        type: 'auth',
        token: this.token
      });
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = () => {
      // Implement reconnection logic
      setTimeout(() => this.connect(), 5000);
    };
  }

  invokeTool(tool, params) {
    return new Promise((resolve, reject) => {
      const requestId = this.generateRequestId();
      
      this.callbacks.set(requestId, {resolve, reject});
      
      this.send({
        type: 'tool_invoke',
        request_id: requestId,
        tool: tool,
        params: params
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.callbacks.has(requestId)) {
          this.callbacks.delete(requestId);
          reject(new Error('Request timeout'));
        }
      }, 30000);
    });
  }

  subscribe(resource) {
    this.send({
      type: 'subscribe',
      resource: resource
    });
  }

  unsubscribe(resource) {
    this.send({
      type: 'unsubscribe',
      resource: resource
    });
  }

  handleMessage(message) {
    switch(message.type) {
      case 'tool_response':
        if (this.callbacks.has(message.request_id)) {
          const callback = this.callbacks.get(message.request_id);
          this.callbacks.delete(message.request_id);
          
          if (message.error) {
            callback.reject(new Error(message.error));
          } else {
            callback.resolve(message.result);
          }
        }
        break;
        
      case 'resource_update':
        this.onResourceUpdate(message.resource, message.data);
        break;
        
      case 'error':
        console.error('WebSocket error:', message.error);
        break;
    }
  }

  send(data) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  onResourceUpdate(resource, data) {
    // Override this method to handle resource updates
    console.log(`Resource update for ${resource}:`, data);
  }

  close() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

// Usage
const wsClient = new MCPWebSocketClient(authToken);

// Subscribe to appointment updates
wsClient.subscribe('appointments');

// Invoke a tool
const result = await wsClient.invokeTool('list_doctors', {
  hospital_id: hospitalId
});

// Handle resource updates
wsClient.onResourceUpdate = (resource, data) => {
  if (resource === 'appointments') {
    updateAppointmentUI(data);
  }
};
```

## Error Handling

### Error Response Format
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Additional context"
    },
    "timestamp": "2025-01-15T12:00:00Z"
  }
}
```

### Common Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `AUTH_REQUIRED` | Authentication token missing | 401 |
| `AUTH_INVALID` | Invalid or expired token | 401 |
| `PERMISSION_DENIED` | User lacks required role | 403 |
| `RESOURCE_NOT_FOUND` | Requested resource doesn't exist | 404 |
| `VALIDATION_ERROR` | Invalid input parameters | 400 |
| `CONFLICT` | Resource conflict (e.g., duplicate) | 409 |
| `RATE_LIMIT` | Too many requests | 429 |
| `SERVER_ERROR` | Internal server error | 500 |

### Error Handling Best Practices

```javascript
class MCPErrorHandler {
  static async handleMCPRequest(tool, params) {
    try {
      const response = await fetch('/api/mcp/tools/invoke', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({tool, params})
      });

      if (!response.ok) {
        const error = await response.json();
        throw new MCPError(error);
      }

      return await response.json();
      
    } catch (error) {
      if (error instanceof MCPError) {
        // Handle MCP-specific errors
        switch(error.code) {
          case 'AUTH_INVALID':
            // Refresh token and retry
            await refreshToken();
            return MCPErrorHandler.handleMCPRequest(tool, params);
            
          case 'PERMISSION_DENIED':
            // Show permission error to user
            showError('You do not have permission for this action');
            break;
            
          case 'VALIDATION_ERROR':
            // Show validation errors
            showValidationErrors(error.details);
            break;
            
          case 'RATE_LIMIT':
            // Implement exponential backoff
            await delay(error.retryAfter * 1000);
            return MCPErrorHandler.handleMCPRequest(tool, params);
            
          default:
            // Generic error handling
            showError(error.message);
        }
      } else {
        // Network or other errors
        console.error('Request failed:', error);
        showError('Network error. Please try again.');
      }
      
      throw error;
    }
  }
}

class MCPError extends Error {
  constructor(errorResponse) {
    super(errorResponse.error.message);
    this.code = errorResponse.error.code;
    this.details = errorResponse.error.details;
    this.timestamp = errorResponse.error.timestamp;
    this.retryAfter = errorResponse.error.retry_after;
  }
}
```

## Performance Optimization

### Caching Strategy

```javascript
class MCPCache {
  constructor(ttl = 300000) { // 5 minutes default TTL
    this.cache = new Map();
    this.ttl = ttl;
  }

  getCacheKey(tool, params) {
    return `${tool}:${JSON.stringify(params)}`;
  }

  async get(tool, params) {
    const key = this.getCacheKey(tool, params);
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.data;
    }
    
    return null;
  }

  set(tool, params, data) {
    const key = this.getCacheKey(tool, params);
    this.cache.set(key, {
      data: data,
      timestamp: Date.now()
    });
  }

  invalidate(pattern) {
    // Invalidate cache entries matching pattern
    for (const [key] of this.cache) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

// Usage with caching
const cache = new MCPCache();

async function getCachedDoctorList(hospitalId) {
  // Check cache first
  let doctors = await cache.get('list_doctors', {hospital_id: hospitalId});
  
  if (!doctors) {
    // Fetch from server
    doctors = await invokeTool('list_doctors', {hospital_id: hospitalId});
    
    // Cache the result
    cache.set('list_doctors', {hospital_id: hospitalId}, doctors);
  }
  
  return doctors;
}
```

### Batch Request Optimization

```javascript
class MCPBatchClient {
  constructor(token) {
    this.token = token;
    this.queue = [];
    this.processing = false;
  }

  async batchInvoke(requests) {
    const response = await fetch('/api/mcp/batch', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({requests})
    });
    
    return await response.json();
  }

  addToQueue(tool, params) {
    return new Promise((resolve, reject) => {
      this.queue.push({tool, params, resolve, reject});
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    
    // Process up to 10 requests at once
    const batch = this.queue.splice(0, 10);
    
    try {
      const results = await this.batchInvoke(
        batch.map(req => ({tool: req.tool, params: req.params}))
      );
      
      batch.forEach((req, index) => {
        if (results[index].error) {
          req.reject(results[index].error);
        } else {
          req.resolve(results[index].result);
        }
      });
    } catch (error) {
      batch.forEach(req => req.reject(error));
    }
    
    this.processing = false;
    
    // Process next batch if queue has more items
    if (this.queue.length > 0) {
      setTimeout(() => this.processQueue(), 100);
    }
  }
}
```

## Security Considerations

### Input Validation

All tool parameters are validated server-side:

```python
# Server-side validation example
from pydantic import BaseModel, validator
from typing import Optional
from datetime import date

class CreateAppointmentParams(BaseModel):
    patient_id: str
    doctor_id: str
    appointment_date: date
    appointment_time: str
    reason: str
    notes: Optional[str] = None
    
    @validator('appointment_time')
    def validate_time(cls, v):
        # Validate time format HH:MM:SS
        import re
        if not re.match(r'^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$', v):
            raise ValueError('Invalid time format')
        return v
    
    @validator('appointment_date')
    def validate_future_date(cls, v):
        if v < date.today():
            raise ValueError('Appointment date must be in the future')
        return v
```

### Rate Limiting

Implement client-side rate limiting:

```javascript
class RateLimiter {
  constructor(maxRequests = 10, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }

  async throttle() {
    const now = Date.now();
    
    // Remove old requests outside the window
    this.requests = this.requests.filter(
      time => now - time < this.windowMs
    );
    
    if (this.requests.length >= this.maxRequests) {
      // Calculate wait time
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest);
      
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.throttle(); // Retry
    }
    
    this.requests.push(now);
  }
}

const rateLimiter = new RateLimiter(10, 60000); // 10 requests per minute

async function rateLimitedInvoke(tool, params) {
  await rateLimiter.throttle();
  return invokeTool(tool, params);
}
```

## Testing

### Unit Test Example

```javascript
// Jest test example
describe('MCP Client', () => {
  let client;
  
  beforeEach(() => {
    client = new MCPClient('test-token');
  });
  
  afterEach(() => {
    client.close();
  });
  
  test('should list doctors successfully', async () => {
    const doctors = await client.invokeTool('list_doctors', {
      hospital_id: 'test-hospital'
    });
    
    expect(doctors).toBeDefined();
    expect(Array.isArray(doctors.results)).toBe(true);
  });
  
  test('should handle authentication errors', async () => {
    client.token = 'invalid-token';
    
    await expect(
      client.invokeTool('list_doctors', {})
    ).rejects.toThrow('AUTH_INVALID');
  });
  
  test('should validate appointment parameters', async () => {
    await expect(
      client.invokeTool('create_appointment', {
        patient_id: 'patient-123',
        // Missing required fields
      })
    ).rejects.toThrow('VALIDATION_ERROR');
  });
});
```

### Integration Test Example

```python
# Pytest integration test
import pytest
import asyncio
from mcp_client import MCPClient

@pytest.mark.asyncio
async def test_appointment_workflow():
    """Test complete appointment booking workflow"""
    
    client = MCPClient('http://localhost:8002', test_token)
    
    # 1. Create a test patient
    patient = await client.invoke_tool('create_user', {
        'email': 'test@example.com',
        'password': 'Test123!',
        'first_name': 'Test',
        'last_name': 'Patient',
        'role': 'PATIENT',
        'hospital_id': test_hospital_id
    })
    
    # 2. List available doctors
    doctors = await client.invoke_tool('list_doctors', {
        'hospital_id': test_hospital_id
    })
    
    assert len(doctors['results']) > 0
    doctor = doctors['results'][0]
    
    # 3. Check availability
    slots = await client.invoke_tool('list_appointment_slots', {
        'doctor_id': doctor['id'],
        'date': '2025-02-01'
    })
    
    assert len(slots['available_times']) > 0
    
    # 4. Book appointment
    appointment = await client.invoke_tool('create_appointment', {
        'patient_id': patient['id'],
        'doctor_id': doctor['id'],
        'appointment_date': '2025-02-01',
        'appointment_time': slots['available_times'][0],
        'reason': 'Test appointment'
    })
    
    assert appointment['status'] == 'SCHEDULED'
    
    # 5. Cleanup
    await client.invoke_tool('delete_user', {
        'user_id': patient['id']
    })
```

## Deployment Considerations

### Environment Variables

```bash
# .env file
MCP_SERVER_HOST=0.0.0.0
MCP_SERVER_PORT=8002
MCP_DATABASE_URL=postgresql://user:pass@localhost/medcor
MCP_JWT_SECRET=your-secret-key
MCP_JWT_EXPIRY=3600
MCP_RATE_LIMIT=100
MCP_SSE_HEARTBEAT_INTERVAL=30
MCP_WEBSOCKET_ENABLED=true
MCP_CACHE_TTL=300
MCP_LOG_LEVEL=INFO
```

### Docker Deployment

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8002

CMD ["python", "manage.py", "runmcpserver"]
```

### Nginx Configuration for SSE

```nginx
location /api/mcp/sse {
    proxy_pass http://localhost:8002;
    proxy_http_version 1.1;
    proxy_set_header Connection '';
    proxy_set_header Cache-Control 'no-cache';
    proxy_set_header X-Accel-Buffering 'no';
    proxy_buffering off;
    proxy_read_timeout 86400;
    keepalive_timeout 90;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## Monitoring and Logging

### Logging Configuration

```python
# settings.py
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'mcp': {
            'format': '[%(asctime)s] %(levelname)s [MCP] %(message)s',
            'datefmt': '%Y-%m-%d %H:%M:%S'
        }
    },
    'handlers': {
        'mcp_file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': 'logs/mcp_server.log',
            'maxBytes': 10485760,  # 10MB
            'backupCount': 5,
            'formatter': 'mcp'
        }
    },
    'loggers': {
        'mcp': {
            'handlers': ['mcp_file'],
            'level': 'INFO',
            'propagate': False
        }
    }
}
```

### Metrics Collection

```javascript
class MCPMetrics {
  constructor() {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      toolUsage: new Map()
    };
  }

  recordRequest(tool, success, responseTime) {
    this.metrics.totalRequests++;
    
    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }
    
    // Update average response time
    const n = this.metrics.totalRequests;
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime * (n - 1) + responseTime) / n;
    
    // Track tool usage
    const usage = this.metrics.toolUsage.get(tool) || 0;
    this.metrics.toolUsage.set(tool, usage + 1);
  }

  getMetrics() {
    return {
      ...this.metrics,
      toolUsage: Object.fromEntries(this.metrics.toolUsage),
      successRate: this.metrics.successfulRequests / this.metrics.totalRequests
    };
  }
}

// Usage
const metrics = new MCPMetrics();

async function instrumentedInvoke(tool, params) {
  const startTime = Date.now();
  let success = false;
  
  try {
    const result = await invokeTool(tool, params);
    success = true;
    return result;
  } finally {
    const responseTime = Date.now() - startTime;
    metrics.recordRequest(tool, success, responseTime);
  }
}
```

## Support and Resources

- **API Documentation**: `/api/docs/` (Swagger UI)
- **ReDoc Documentation**: `/api/redoc/`
- **MCP Specification**: https://modelcontextprotocol.org
- **GitHub Repository**: [Your repository URL]
- **Support Email**: support@medcor.ai

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-01-15 | Initial MCP server implementation |
| 1.1.0 | 2025-01-20 | Added SSE support |
| 1.2.0 | 2025-02-01 | WebSocket support and batch operations |
| 1.3.0 | 2025-02-15 | Enhanced analytics and specialty management |

---

*This documentation is maintained by the MedCor AI development team. For updates or corrections, please submit a pull request or contact the maintainers.*