#!/usr/bin/env python3
"""
MedCor.ai MCP Server - Updated Implementation
Comprehensive healthcare management server with multi-tenant support
"""

import os
import sys
import django
import requests
import json
from typing import Dict, List, Any, Optional, Union
from datetime import datetime, date
from decimal import Decimal

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medcor_backend.settings')

try:
    django.setup()
    print("✅ Django environment configured successfully")
except Exception as e:
    print(f"❌ Failed to configure Django environment: {e}")
    sys.exit(1)

# Import Django models after setup
from django.db import connection
from django.core.exceptions import ObjectDoesNotExist
from django.contrib.auth.hashers import make_password
from tenants.models import Client, Domain, User
from treatment.models import Treatment
try:
    from appointment.models import Appointment, Slot, SlotExclusion
except ImportError:
    print("⚠️  Appointment models not available")
    Appointment = None
    Slot = None
    SlotExclusion = None

# MCP Server Configuration
API_BASE_URL = "http://localhost:8000"
DEFAULT_HEADERS = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
}

try:
    from fastmcp import FastMCP
    mcp = FastMCP("MedCor Healthcare Management System")
    FASTMCP_AVAILABLE = True
    print("✅ FastMCP available - using full MCP implementation")
except ImportError:
    # Enhanced Mock MCP for development
    print("⚠️  FastMCP not available - using enhanced mock implementation")
    FASTMCP_AVAILABLE = False
    
    class EnhancedMockMCP:
        """Enhanced Mock MCP server with comprehensive logging"""
        def __init__(self, name: str):
            self.name = name
            self.tools = {}
            self.resources = {}
            self.prompts = {}
        
        def tool(self):
            def decorator(func):
                self.tools[func.__name__] = func
                print(f"🔧 Registered tool: {func.__name__}")
                return func
            return decorator
        
        def resource(self, uri: str):
            def decorator(func):
                self.resources[uri] = func
                print(f"📁 Registered resource: {uri}")
                return func
            return decorator
        
        def prompt(self, name: str):
            def decorator(func):
                self.prompts[name] = func
                print(f"📝 Registered prompt: {name}")
                return func
            return decorator
        
        def run(self):
            print(f"\n🚀 Enhanced Mock MCP Server '{self.name}' is running...")
            print(f"📊 Total Tools: {len(self.tools)}")
            print(f"📊 Total Resources: {len(self.resources)}")  
            print(f"📊 Total Prompts: {len(self.prompts)}")
    
    mcp = EnhancedMockMCP("MedCor Healthcare Management System")

# ================================
# UTILITY FUNCTIONS
# ================================

def make_api_request(endpoint: str, method: str = 'GET', data: Dict = None, tenant_host: str = None) -> Dict:
    """Make API request with proper error handling and tenant support"""
    url = f"{API_BASE_URL}{endpoint}"
    headers = DEFAULT_HEADERS.copy()
    
    # Add tenant host header for multi-tenant requests
    if tenant_host:
        headers['Host'] = tenant_host
    
    try:
        if method.upper() == 'GET':
            response = requests.get(url, headers=headers, timeout=30)
        elif method.upper() == 'POST':
            response = requests.post(url, headers=headers, json=data, timeout=30)
        elif method.upper() == 'PUT':
            response = requests.put(url, headers=headers, json=data, timeout=30)
        elif method.upper() == 'PATCH':
            response = requests.patch(url, headers=headers, json=data, timeout=30)
        elif method.upper() == 'DELETE':
            response = requests.delete(url, headers=headers, timeout=30)
        else:
            return {"error": f"Unsupported HTTP method: {method}"}
        
        response.raise_for_status()
        return response.json() if response.content else {"success": True}
        
    except requests.exceptions.RequestException as e:
        return {"error": f"API request failed: {str(e)}"}
    except json.JSONDecodeError:
        return {"error": "Invalid JSON response from API"}
    except Exception as e:
        return {"error": f"Unexpected error: {str(e)}"}

def serialize_datetime(obj):
    """JSON serializer for datetime objects"""
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    elif isinstance(obj, Decimal):
        return float(obj)
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")

# ================================
# TENANT MANAGEMENT TOOLS
# ================================

@mcp.tool()
def list_tenants() -> Dict[str, Any]:
    """List all available tenants (hospitals/clinics)"""
    return make_api_request("/api/tenants/hospitals-clinics/")

@mcp.tool()
def get_tenant_details(tenant_id: int) -> Dict[str, Any]:
    """Get detailed information about a specific tenant"""
    return make_api_request(f"/api/tenants/hospitals-clinics/{tenant_id}/")

@mcp.tool()
def create_tenant(name: str, schema_name: str, description: str = "", contact_email: str = "") -> Dict[str, Any]:
    """Create a new tenant (hospital/clinic)"""
    data = {
        "name": name,
        "schema_name": schema_name,
        "description": description,
        "contact_email": contact_email
    }
    return make_api_request("/api/tenants/hospitals-clinics/", method="POST", data=data)

@mcp.tool()
def list_tenant_domains() -> Dict[str, Any]:
    """List all tenant domains"""
    return make_api_request("/api/tenants/domains/")

@mcp.tool()
def create_tenant_domain(domain: str, tenant_id: int, is_primary: bool = False) -> Dict[str, Any]:
    """Create a new domain for a tenant"""
    data = {
        "domain": domain,
        "tenant": tenant_id,
        "is_primary": is_primary
    }
    return make_api_request("/api/tenants/domains/", method="POST", data=data)

# ================================
# USER MANAGEMENT TOOLS
# ================================

@mcp.tool()
def list_doctors(tenant_id: int = None) -> Dict[str, Any]:
    """List all doctors, optionally filtered by tenant"""
    if tenant_id:
        endpoint = f"/api/tenants/users/doctors/?tenant={tenant_id}"
    else:
        endpoint = "/api/medical/doctors/"
    return make_api_request(endpoint)

@mcp.tool()
def get_doctor_details(doctor_id: int) -> Dict[str, Any]:
    """Get detailed information about a specific doctor"""
    return make_api_request(f"/api/medical/doctors/{doctor_id}/")

@mcp.tool()
def create_doctor(email: str, first_name: str, last_name: str, specialization: str, tenant_id: int = None) -> Dict[str, Any]:
    """Create a new doctor account"""
    data = {
        "email": email,
        "first_name": first_name,
        "last_name": last_name,
        "specialization": specialization,
        "role": "doctor"
    }
    if tenant_id:
        data["tenant"] = tenant_id
    return make_api_request("/api/medical/doctors/", method="POST", data=data)

@mcp.tool()
def list_patients(tenant_id: int = None) -> Dict[str, Any]:
    """List all patients, optionally filtered by tenant"""
    if tenant_id:
        endpoint = f"/api/tenants/users/patients/?tenant={tenant_id}"
    else:
        endpoint = "/api/medical/patients/"
    return make_api_request(endpoint)

@mcp.tool()
def get_patient_details(patient_id: int) -> Dict[str, Any]:
    """Get detailed information about a specific patient"""
    return make_api_request(f"/api/medical/patients/{patient_id}/")

@mcp.tool()
def create_patient(email: str, first_name: str, last_name: str, phone_number: str = "", tenant_id: int = None) -> Dict[str, Any]:
    """Create a new patient account"""
    data = {
        "email": email,
        "first_name": first_name,
        "last_name": last_name,
        "phone_number": phone_number,
        "role": "patient"
    }
    if tenant_id:
        data["tenant"] = tenant_id
    return make_api_request("/api/medical/patients/", method="POST", data=data)

@mcp.tool()
def list_nurses(tenant_id: int = None) -> Dict[str, Any]:
    """List all nurses, optionally filtered by tenant"""
    if tenant_id:
        endpoint = f"/api/tenants/users/nurses/?tenant={tenant_id}"
    else:
        endpoint = "/api/tenants/users/nurses/"
    return make_api_request(endpoint)

# ================================
# APPOINTMENT MANAGEMENT TOOLS
# ================================

@mcp.tool()
def list_appointments(tenant_id: int = None, status: str = None) -> Dict[str, Any]:
    """List appointments with optional filtering"""
    params = []
    if tenant_id:
        params.append(f"tenant={tenant_id}")
    if status:
        params.append(f"status={status}")
    
    query_string = "?" + "&".join(params) if params else ""
    return make_api_request(f"/api/appointments/appointments/{query_string}")

@mcp.tool()
def get_appointment_details(appointment_id: int) -> Dict[str, Any]:
    """Get detailed information about a specific appointment"""
    return make_api_request(f"/api/appointments/appointments/{appointment_id}/")

@mcp.tool()
def create_appointment(patient_id: int, doctor_id: int, treatment_id: int, 
                      appointment_date: str, appointment_time: str, 
                      notes: str = "", tenant_id: int = None) -> Dict[str, Any]:
    """Create a new appointment"""
    data = {
        "patient": patient_id,
        "doctor": doctor_id,
        "treatment": treatment_id,
        "appointment_date": appointment_date,
        "appointment_time": appointment_time,
        "notes": notes,
        "status": "pending"
    }
    if tenant_id:
        data["tenant"] = tenant_id
    return make_api_request("/api/appointments/appointments/", method="POST", data=data)

@mcp.tool()
def update_appointment_status(appointment_id: int, status: str) -> Dict[str, Any]:
    """Update appointment status (pending, confirmed, completed, cancelled)"""
    data = {"status": status}
    return make_api_request(f"/api/appointments/appointments/{appointment_id}/", method="PATCH", data=data)

@mcp.tool()
def list_appointment_slots(doctor_id: int = None, date: str = None) -> Dict[str, Any]:
    """List available appointment slots"""
    params = []
    if doctor_id:
        params.append(f"doctor={doctor_id}")
    if date:
        params.append(f"date={date}")
    
    query_string = "?" + "&".join(params) if params else ""
    return make_api_request(f"/api/appointments/slots/{query_string}")

@mcp.tool()
def create_appointment_slot(doctor_id: int, day_of_week: int, start_time: str, end_time: str) -> Dict[str, Any]:
    """Create a new appointment slot for a doctor"""
    data = {
        "doctor": doctor_id,
        "day_of_week": day_of_week,  # 0=Monday, 6=Sunday
        "start_time": start_time,
        "end_time": end_time,
        "is_available": True
    }
    return make_api_request("/api/appointments/slots/", method="POST", data=data)

# ================================
# TREATMENT MANAGEMENT TOOLS
# ================================

@mcp.tool()
def list_treatments(tenant_id: int = None, search: str = None) -> Dict[str, Any]:
    """List all treatments with optional filtering"""
    params = []
    if tenant_id:
        params.append(f"tenant={tenant_id}")
    if search:
        params.append(f"search={search}")
    
    query_string = "?" + "&".join(params) if params else ""
    return make_api_request(f"/api/treatments/{query_string}")

@mcp.tool()
def get_treatment_details(treatment_id: int) -> Dict[str, Any]:
    """Get detailed information about a specific treatment"""
    return make_api_request(f"/api/treatments/{treatment_id}/")

@mcp.tool()
def create_treatment(name: str, description: str, cost: float, tenant_id: int) -> Dict[str, Any]:
    """Create a new treatment"""
    data = {
        "name": name,
        "description": description,
        "cost": cost,
        "tenant": tenant_id
    }
    return make_api_request("/api/treatments/", method="POST", data=data)

@mcp.tool()
def update_treatment(treatment_id: int, name: str = None, description: str = None, cost: float = None) -> Dict[str, Any]:
    """Update an existing treatment"""
    data = {}
    if name:
        data["name"] = name
    if description:
        data["description"] = description
    if cost:
        data["cost"] = cost
    
    return make_api_request(f"/api/treatments/{treatment_id}/", method="PATCH", data=data)

@mcp.tool()
def get_treatment_stats(tenant_id: int = None) -> Dict[str, Any]:
    """Get treatment statistics"""
    endpoint = f"/api/treatments/stats/"
    if tenant_id:
        endpoint += f"?tenant={tenant_id}"
    return make_api_request(endpoint)

# ================================
# SUBSCRIPTION MANAGEMENT TOOLS
# ================================

@mcp.tool()
def list_subscription_plans() -> Dict[str, Any]:
    """List all available subscription plans"""
    return make_api_request("/api/subscription/plans/")

@mcp.tool()
def get_subscription_plan_details(plan_id: int) -> Dict[str, Any]:
    """Get detailed information about a subscription plan"""
    return make_api_request(f"/api/subscription/plans/{plan_id}/")

@mcp.tool()
def create_subscription_plan(name: str, price: float, billing_cycle: str, features: Dict) -> Dict[str, Any]:
    """Create a new subscription plan"""
    data = {
        "name": name,
        "price": price,
        "billing_cycle": billing_cycle,
        "features": features,
        "is_active": True
    }
    return make_api_request("/api/subscription/plans/", method="POST", data=data)

@mcp.tool()
def list_subscriptions(tenant_id: int = None) -> Dict[str, Any]:
    """List subscriptions, optionally filtered by tenant"""
    endpoint = "/api/subscription/subscriptions/"
    if tenant_id:
        endpoint += f"?tenant={tenant_id}"
    return make_api_request(endpoint)

@mcp.tool()
def create_subscription(tenant_id: int, plan_id: int) -> Dict[str, Any]:
    """Create a new subscription for a tenant"""
    data = {
        "tenant": tenant_id,
        "plan": plan_id,
        "status": "active",
        "start_date": datetime.now().date().isoformat()
    }
    return make_api_request("/api/subscription/subscriptions/", method="POST", data=data)

# ================================
# AUTHENTICATION TOOLS
# ================================

@mcp.tool()
def admin_login(username: str, password: str) -> Dict[str, Any]:
    """Authenticate admin user and get access token"""
    data = {
        "username": username,
        "password": password
    }
    return make_api_request("/api/auth/login/", method="POST", data=data)

@mcp.tool()
def get_admin_profile(token: str) -> Dict[str, Any]:
    """Get admin user profile information"""
    headers = DEFAULT_HEADERS.copy()
    headers['Authorization'] = f'Bearer {token}'
    try:
        response = requests.get(f"{API_BASE_URL}/api/auth/profile/", headers=headers)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        return {"error": f"Failed to get profile: {str(e)}"}

@mcp.tool()
def list_all_users(token: str) -> Dict[str, Any]:
    """List all users in the system (admin only)"""
    headers = DEFAULT_HEADERS.copy()
    headers['Authorization'] = f'Bearer {token}'
    try:
        response = requests.get(f"{API_BASE_URL}/api/auth/users/", headers=headers)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        return {"error": f"Failed to get users: {str(e)}"}

# ================================
# SYSTEM HEALTH AND ANALYTICS
# ================================

@mcp.tool()
def health_check() -> Dict[str, Any]:
    """Check system health and API availability"""
    return make_api_request("/api/health/")

@mcp.tool()
def get_system_stats() -> Dict[str, Any]:
    """Get comprehensive system statistics"""
    try:
        stats = {}
        
        # Get tenant stats
        tenants_response = make_api_request("/api/tenants/hospitals-clinics/")
        stats["total_tenants"] = len(tenants_response.get("results", []))
        
        # Get user stats
        doctors_response = make_api_request("/api/medical/doctors/")
        patients_response = make_api_request("/api/medical/patients/")
        stats["total_doctors"] = len(doctors_response.get("results", []))
        stats["total_patients"] = len(patients_response.get("results", []))
        
        # Get appointment stats
        appointments_response = make_api_request("/api/appointments/appointments/")
        stats["total_appointments"] = len(appointments_response.get("results", []))
        
        # Get treatment stats
        treatments_response = make_api_request("/api/treatments/")
        stats["total_treatments"] = len(treatments_response.get("results", []))
        
        return {
            "status": "success",
            "timestamp": datetime.now().isoformat(),
            "statistics": stats
        }
        
    except Exception as e:
        return {"error": f"Failed to get system stats: {str(e)}"}

# ================================
# MCP RESOURCES
# ================================

@mcp.resource("healthcare://api/documentation")
def api_documentation():
    """Comprehensive API documentation"""
    return {
        "title": "MedCor Healthcare API Documentation",
        "version": "1.0",
        "base_url": API_BASE_URL,
        "endpoints": {
            "tenants": "/api/tenants/",
            "medical": "/api/medical/",
            "appointments": "/api/appointments/",
            "treatments": "/api/treatments/",
            "subscriptions": "/api/subscription/",
            "authentication": "/api/auth/",
            "health": "/api/health/"
        },
        "authentication": {
            "type": "JWT Bearer Token",
            "login_endpoint": "/api/auth/login/",
            "header_format": "Authorization: Bearer <token>"
        }
    }

@mcp.resource("healthcare://tenants/list")
def tenant_list_resource():
    """Current list of all tenants"""
    return make_api_request("/api/tenants/hospitals-clinics/")

@mcp.resource("healthcare://system/status")
def system_status_resource():
    """Current system status and health"""
    return {
        "health": make_api_request("/api/health/"),
        "statistics": get_system_stats(),
        "timestamp": datetime.now().isoformat()
    }

# ================================
# MCP PROMPTS
# ================================

@mcp.prompt("schedule_appointment")
def schedule_appointment_prompt():
    """Guided workflow for scheduling appointments"""
    return """
🏥 APPOINTMENT SCHEDULING ASSISTANT

To schedule an appointment, I'll guide you through these steps:

1. **Identify Patient**
   - Use list_patients() to find existing patients
   - Or create_patient() for new patients

2. **Select Doctor**
   - Use list_doctors() to find available doctors
   - Filter by specialization if needed

3. **Choose Treatment**
   - Use list_treatments() to see available treatments
   - Get treatment details with get_treatment_details()

4. **Check Availability**
   - Use list_appointment_slots() to see doctor's schedule
   - Pick an available date and time

5. **Create Appointment**
   - Use create_appointment() with all the details
   - Status will be set to 'pending' initially

6. **Confirmation**
   - Use update_appointment_status() to confirm when ready

Required information:
- Patient ID or details for new patient
- Doctor ID
- Treatment ID  
- Appointment date (YYYY-MM-DD)
- Appointment time (HH:MM)
- Optional notes
- Tenant ID (for multi-tenant setups)

Need help with any step? Just ask!
"""

@mcp.prompt("tenant_setup")
def tenant_setup_prompt():
    """Guided workflow for setting up new tenants"""
    return """
🏢 TENANT SETUP ASSISTANT

Setting up a new hospital or clinic requires these steps:

1. **Create Tenant Organization**
   - Use create_tenant() with:
     * name: Hospital/Clinic name
     * schema_name: unique identifier (lowercase, underscores)
     * description: Brief description
     * contact_email: Main contact

2. **Configure Domain**
   - Use create_tenant_domain() to set up:
     * domain: Custom domain or subdomain
     * tenant_id: From step 1
     * is_primary: True for main domain

3. **Create Initial Users**
   - Use create_doctor() for medical staff
   - Use create_patient() for initial patients  
   - Use create admin user for management

4. **Set Up Treatments**
   - Use create_treatment() for services offered
   - Include proper pricing and descriptions

5. **Configure Subscription**
   - Use create_subscription() to assign a plan
   - Choose appropriate features and billing

6. **Test Setup**
   - Use health_check() to verify API access
   - Test appointment scheduling workflow

Each tenant gets isolated data and can be customized independently.
Ready to set up a new tenant?
"""

@mcp.prompt("system_maintenance")
def system_maintenance_prompt():
    """System maintenance and monitoring assistant"""
    return """
🔧 SYSTEM MAINTENANCE ASSISTANT

Regular maintenance tasks to keep MedCor running smoothly:

**Health Monitoring:**
- Use health_check() to verify system status
- Use get_system_stats() for comprehensive metrics
- Monitor API response times and errors

**User Management:**
- Use list_all_users() to review user accounts
- Check for inactive or duplicate accounts
- Verify user roles and permissions

**Data Analytics:**
- Use get_treatment_stats() for treatment insights
- Monitor appointment patterns and cancellations
- Track subscription usage and billing

**Performance Optimization:**
- Review slow API endpoints
- Check database query performance
- Monitor server resource usage

**Backup and Security:**
- Verify database backups are current
- Check API authentication logs
- Review tenant data isolation

**Troubleshooting Common Issues:**
- API timeout errors: Check server load
- Authentication failures: Verify JWT tokens
- Tenant access issues: Check domain configuration

Run get_system_stats() to get current system overview.
Need help with specific maintenance tasks?
"""

# ================================
# MAIN EXECUTION
# ================================

if __name__ == "__main__":
    print("\n" + "="*80)
    print("🏥 MEDCOR HEALTHCARE MCP SERVER")
    print("="*80)
    print(f"📡 API Base URL: {API_BASE_URL}")
    print(f"🔧 FastMCP Available: {FASTMCP_AVAILABLE}")
    print(f"📊 Tools Registered: {len(mcp.tools)}")
    print(f"📁 Resources Available: {len(mcp.resources)}")
    print(f"📝 Prompts Available: {len(mcp.prompts)}")
    print("="*80)
    
    if FASTMCP_AVAILABLE:
        print("🚀 Starting MCP Server...")
        mcp.run()
    else:
        print("🔄 Running Enhanced Mock Server...")
        mcp.run()
        
        print(f"\n📋 Available Tools ({len(mcp.tools)}):")
        for i, tool_name in enumerate(sorted(mcp.tools.keys()), 1):
            print(f"   {i:2d}. {tool_name}")
        
        print(f"\n📁 Available Resources ({len(mcp.resources)}):")
        for i, resource_uri in enumerate(sorted(mcp.resources.keys()), 1):
            print(f"   {i:2d}. {resource_uri}")
        
        print(f"\n📝 Available Prompts ({len(mcp.prompts)}):")
        for i, prompt_name in enumerate(sorted(mcp.prompts.keys()), 1):
            print(f"   {i:2d}. {prompt_name}")
        
        print("\n💡 Usage Instructions:")
        print("   1. Connect your MCP client to this server")
        print("   2. Use tools for healthcare management operations")
        print("   3. Access resources for documentation and data")
        print("   4. Use prompts for guided workflows")
        print("   5. All operations support multi-tenant architecture")
        
        print("\n🔗 Key Endpoints:")
        print("   • API Documentation: http://localhost:8000/api/docs/")
        print("   • Admin Panel: http://localhost:8000/admin/")
        print("   • Health Check: http://localhost:8000/api/health/")
        
        print("\n✅ MCP Server Ready for Connections")