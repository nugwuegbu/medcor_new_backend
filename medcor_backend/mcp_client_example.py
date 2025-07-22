#!/usr/bin/env python3
"""
MedCor.ai MCP Client Example
Demonstrates how to use the MCP tools for healthcare entity management
"""

import asyncio
import json
from typing import Dict, Any, List

# Simulated MCP client calls (in real implementation, these would connect to MCP server)
class MCPClient:
    """Example MCP client for testing healthcare tools"""
    
    def __init__(self):
        self.tools_available = [
            "list_doctors", "create_doctor",
            "list_nurses", "create_nurse", 
            "list_patients", "create_patient",    
            "list_treatments", "create_treatment",
            "list_appointments", "create_appointment"
        ]
    
    async def call_tool(self, tool_name: str, **kwargs) -> Dict[str, Any]:
        """Simulate MCP tool call"""
        print(f"🔧 Calling MCP tool: {tool_name}")
        print(f"📊 Parameters: {json.dumps(kwargs, indent=2)}")
        
        # In real implementation, this would make actual MCP calls
        # For demo, we return success messages
        return {
            "success": True,
            "tool": tool_name,
            "parameters": kwargs,
            "message": f"Tool {tool_name} called successfully"
        }
    
    async def get_resource(self, resource_uri: str) -> str:
        """Get MCP resource"""
        print(f"📁 Accessing MCP resource: {resource_uri}")
        return f"Resource data for {resource_uri}"
    
    async def use_prompt(self, prompt_name: str) -> str:
        """Get MCP prompt template"""
        print(f"📝 Using MCP prompt: {prompt_name}")
        return f"Prompt template for {prompt_name}"

async def demo_doctor_management():
    """Demonstrate doctor management tools"""
    client = MCPClient()
    
    print("\n👨‍⚕️ DOCTOR MANAGEMENT DEMO")
    print("=" * 50)
    
    # List existing doctors
    doctors = await client.call_tool("list_doctors", limit=5, active_only=True)
    print("✅ Listed doctors:", doctors)
    
    # Create a new doctor
    new_doctor = await client.call_tool(
        "create_doctor",
        email="dr.smith@medcor.ai",
        password="securepass123",
        first_name="John",
        last_name="Smith",
        phone_number="+1-555-0123",
        specialization="Cardiology",
        license_number="MD12345",
        years_of_experience=10
    )
    print("✅ Created doctor:", new_doctor)

async def demo_nurse_management():
    """Demonstrate nurse management tools"""
    client = MCPClient()
    
    print("\n👩‍⚕️ NURSE MANAGEMENT DEMO")
    print("=" * 50)
    
    # List existing nurses
    nurses = await client.call_tool("list_nurses", limit=5, active_only=True)
    print("✅ Listed nurses:", nurses)
    
    # Create a new nurse
    new_nurse = await client.call_tool(
        "create_nurse",
        email="nurse.johnson@medcor.ai",
        password="securepass123",
        first_name="Sarah",
        last_name="Johnson",
        phone_number="+1-555-0456",
        department="ICU",
        shift_schedule="Day",
        certification_level="RN"
    )
    print("✅ Created nurse:", new_nurse)

async def demo_patient_management():
    """Demonstrate patient management tools"""
    client = MCPClient()
    
    print("\n👤 PATIENT MANAGEMENT DEMO")
    print("=" * 50)
    
    # List existing patients
    patients = await client.call_tool("list_patients", limit=5, active_only=True)
    print("✅ Listed patients:", patients)
    
    # Create a new patient
    new_patient = await client.call_tool(
        "create_patient",
        email="patient.doe@email.com",
        password="securepass123",
        first_name="Jane",
        last_name="Doe",
        phone_number="+1-555-0789",
        date_of_birth="1985-03-15",
        medical_record_number="MRN123456",
        blood_type="A+",
        insurance_provider="BlueCross",
        allergies="Penicillin, Shellfish"
    )
    print("✅ Created patient:", new_patient)

async def demo_treatment_management():
    """Demonstrate treatment management tools"""
    client = MCPClient()
    
    print("\n💊 TREATMENT MANAGEMENT DEMO")
    print("=" * 50)
    
    # List existing treatments
    treatments = await client.call_tool("list_treatments", limit=10)
    print("✅ Listed treatments:", treatments)
    
    # Create a new treatment
    new_treatment = await client.call_tool(
        "create_treatment",
        name="Cardiac Consultation",
        cost=250.00,
        description="Comprehensive cardiac evaluation and consultation",
        tenant_id=1
    )
    print("✅ Created treatment:", new_treatment)

async def demo_appointment_management():
    """Demonstrate appointment management tools"""
    client = MCPClient()
    
    print("\n📅 APPOINTMENT MANAGEMENT DEMO")
    print("=" * 50)
    
    # List existing appointments
    appointments = await client.call_tool("list_appointments", limit=10, status="pending")
    print("✅ Listed appointments:", appointments)
    
    # Create a new appointment
    new_appointment = await client.call_tool(
        "create_appointment",
        patient_id=1,
        doctor_id=2,
        treatment_id=3,
        date="2025-08-01",
        time="14:30",
        notes="Follow-up cardiac consultation",
        tenant_id=1
    )
    print("✅ Created appointment:", new_appointment)

async def demo_resources_and_prompts():
    """Demonstrate MCP resources and prompts"""
    client = MCPClient()
    
    print("\n📁 RESOURCES & PROMPTS DEMO")
    print("=" * 50)
    
    # Access healthcare resources
    resources = [
        "healthcare://doctors",
        "healthcare://nurses", 
        "healthcare://patients",
        "healthcare://treatments",
        "healthcare://appointments"
    ]
    
    for resource in resources:
        data = await client.get_resource(resource)
        print(f"✅ Accessed resource: {resource}")
    
    # Use prompt templates
    prompts = [
        "create_medical_staff",
        "create_patient_profile", 
        "schedule_appointment"
    ]
    
    for prompt in prompts:
        template = await client.use_prompt(prompt)
        print(f"✅ Used prompt: {prompt}")

async def full_workflow_demo():
    """Demonstrate complete healthcare workflow"""
    client = MCPClient()
    
    print("\n🏥 COMPLETE WORKFLOW DEMO")
    print("=" * 50)
    
    # Step 1: Create medical staff
    print("📋 Step 1: Creating medical staff...")
    doctor = await client.call_tool(
        "create_doctor",
        email="dr.wilson@medcor.ai",
        password="securepass123",
        first_name="Michael",
        last_name="Wilson",
        specialization="Internal Medicine",
        license_number="MD67890"
    )
    
    nurse = await client.call_tool(
        "create_nurse", 
        email="nurse.brown@medcor.ai",
        password="securepass123",
        first_name="Lisa",
        last_name="Brown",
        department="General Medicine"
    )
    
    # Step 2: Create a patient
    print("📋 Step 2: Creating patient...")
    patient = await client.call_tool(
        "create_patient",
        email="patient.miller@email.com",
        password="securepass123",
        first_name="Robert",
        last_name="Miller",
        blood_type="O+"
    )
    
    # Step 3: Create a treatment
    print("📋 Step 3: Creating treatment...")
    treatment = await client.call_tool(
        "create_treatment",
        name="General Consultation",
        cost=150.00,
        description="General medical consultation and examination"
    )
    
    # Step 4: Schedule appointment
    print("📋 Step 4: Scheduling appointment...")
    appointment = await client.call_tool(
        "create_appointment",
        patient_id=1,
        doctor_id=1, 
        treatment_id=1,
        date="2025-08-15",
        time="10:00",
        notes="Initial consultation"
    )
    
    print("✅ Complete workflow finished successfully!")

async def main():
    """Run all MCP demos"""
    print("🚀 MedCor.ai MCP Healthcare Management Demo")
    print("=" * 60)
    
    try:
        # Run individual demos
        await demo_doctor_management()
        await demo_nurse_management()
        await demo_patient_management()
        await demo_treatment_management()
        await demo_appointment_management()
        await demo_resources_and_prompts()
        
        # Run complete workflow demo
        await full_workflow_demo()
        
        print("\n✅ All MCP demos completed successfully!")
        
        # Print available tools summary
        client = MCPClient()
        print(f"\n🔧 Available MCP Tools: {len(client.tools_available)}")
        for i, tool in enumerate(client.tools_available, 1):
            print(f"  {i:2d}. {tool}")
        
        print("\n📊 MCP Resources:")
        print("   - healthcare://doctors")
        print("   - healthcare://nurses")
        print("   - healthcare://patients") 
        print("   - healthcare://treatments")
        print("   - healthcare://appointments")
        
        print("\n📝 MCP Prompts:")
        print("   - create_medical_staff")
        print("   - create_patient_profile")
        print("   - schedule_appointment")
        
    except Exception as e:
        print(f"❌ Demo failed: {str(e)}")

if __name__ == "__main__":
    asyncio.run(main())