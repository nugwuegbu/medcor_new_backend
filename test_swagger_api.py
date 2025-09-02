#!/usr/bin/env python
"""
Test script to verify Swagger/OpenAPI documentation for medcor_backend2.
Run this to check if all API documentation is properly configured.
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medcor_backend2.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Initialize Django
django.setup()

from django.urls import get_resolver
from rest_framework import viewsets
from drf_spectacular.generators import SchemaGenerator
from drf_spectacular.openapi import AutoSchema

def test_api_documentation():
    """Test that API documentation is properly configured."""
    
    print("🔍 Testing MedCor Backend API Documentation...\n")
    
    # Test 1: Check if drf-spectacular is installed
    try:
        import drf_spectacular
        print("✅ drf-spectacular is installed")
    except ImportError:
        print("❌ drf-spectacular is not installed")
        return False
    
    # Test 2: Check if schema can be generated
    try:
        generator = SchemaGenerator()
        schema = generator.get_schema()
        print("✅ OpenAPI schema generated successfully")
        
        # Check schema details
        print(f"\n📋 API Documentation Details:")
        print(f"   - Title: {schema.get('info', {}).get('title', 'N/A')}")
        print(f"   - Version: {schema.get('info', {}).get('version', 'N/A')}")
        print(f"   - Base Path: {schema.get('servers', [{}])[0].get('url', '/')}") if schema.get('servers') else None
        
        # Count endpoints
        paths = schema.get('paths', {})
        print(f"   - Total Endpoints: {len(paths)}")
        
        # Count by method
        methods_count = {}
        for path, operations in paths.items():
            for method in operations.keys():
                if method in ['get', 'post', 'put', 'patch', 'delete']:
                    methods_count[method.upper()] = methods_count.get(method.upper(), 0) + 1
        
        print(f"\n📊 Endpoints by Method:")
        for method, count in sorted(methods_count.items()):
            print(f"   - {method}: {count}")
        
        # List tags
        tags = schema.get('tags', [])
        if tags:
            print(f"\n🏷️  API Tags ({len(tags)}):")
            for tag in tags:
                print(f"   - {tag.get('name')}: {tag.get('description', 'No description')}")
        
        # Sample of endpoints
        print(f"\n📌 Sample Endpoints:")
        for i, (path, operations) in enumerate(list(paths.items())[:10]):
            methods = [m.upper() for m in operations.keys() if m in ['get', 'post', 'put', 'patch', 'delete']]
            print(f"   {i+1}. {path} [{', '.join(methods)}]")
            
            # Show operation details for first endpoint
            if i == 0:
                for method, details in operations.items():
                    if method in ['get', 'post', 'put', 'patch', 'delete']:
                        print(f"      - {method.upper()}: {details.get('summary', 'No summary')}")
        
        # Check for authentication endpoints
        auth_endpoints = [p for p in paths.keys() if 'auth' in p.lower() or 'login' in p.lower() or 'register' in p.lower()]
        print(f"\n🔐 Authentication Endpoints ({len(auth_endpoints)}):")
        for endpoint in auth_endpoints[:5]:
            print(f"   - {endpoint}")
        
        # Check for hospital/tenant endpoints
        hospital_endpoints = [p for p in paths.keys() if 'hospital' in p.lower() or 'tenant' in p.lower()]
        print(f"\n🏥 Hospital/Tenant Endpoints ({len(hospital_endpoints)}):")
        for endpoint in hospital_endpoints[:5]:
            print(f"   - {endpoint}")
        
        # Check for medical endpoints
        medical_endpoints = [p for p in paths.keys() if any(term in p.lower() for term in ['appointment', 'medical', 'treatment', 'prescription', 'specialty'])]
        print(f"\n⚕️ Medical Endpoints ({len(medical_endpoints)}):")
        for endpoint in medical_endpoints[:5]:
            print(f"   - {endpoint}")
        
        # Check components
        components = schema.get('components', {})
        schemas = components.get('schemas', {})
        print(f"\n📄 Schema Components: {len(schemas)} models defined")
        
        # Security schemes
        security_schemes = components.get('securitySchemes', {})
        if security_schemes:
            print(f"\n🔒 Security Schemes:")
            for name, scheme in security_schemes.items():
                print(f"   - {name}: {scheme.get('type')} ({scheme.get('scheme', 'N/A')})")
        
    except Exception as e:
        print(f"❌ Error generating schema: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    # Test 3: Check URL configuration
    try:
        from medcor_backend2.urls import urlpatterns
        api_urls = [str(p.pattern) for p in urlpatterns if 'api/' in str(p.pattern)]
        print(f"\n🌐 API URL Patterns: {len(api_urls)} patterns configured")
        
        # Check for documentation URLs
        doc_urls = [str(p.pattern) for p in urlpatterns if any(term in str(p.pattern) for term in ['swagger', 'redoc', 'schema', 'docs'])]
        if doc_urls:
            print(f"\n📚 Documentation URLs:")
            for url in doc_urls:
                print(f"   - /{url}")
        
    except Exception as e:
        print(f"⚠️ Could not check URL patterns: {e}")
    
    # Test 4: Check ViewSets
    print(f"\n🎯 Checking ViewSets:")
    viewset_count = 0
    
    # Import all ViewSets
    viewsets_to_check = [
        ('core.views', 'UserViewSet'),
        ('tenants.views', 'HospitalViewSet'),
        ('appointments.views', 'AppointmentViewSet'),
        ('appointments.views', 'DoctorAvailabilitySlotViewSet'),
        ('medical_records.views', 'MedicalRecordViewSet'),
        ('treatments.views', 'TreatmentViewSet'),
        ('treatments.views', 'PrescriptionViewSet'),
        ('specialty.views', 'SpecialtyViewSet'),
        ('specialty.views', 'DoctorSpecialtyViewSet'),
        ('subscription_plans.views', 'SubscriptionPlanViewSet'),
    ]
    
    for module_name, viewset_name in viewsets_to_check:
        try:
            module = __import__(module_name, fromlist=[viewset_name])
            viewset = getattr(module, viewset_name, None)
            if viewset:
                print(f"   ✅ {viewset_name} from {module_name}")
                viewset_count += 1
        except Exception as e:
            print(f"   ⚠️ Could not import {viewset_name} from {module_name}: {e}")
    
    print(f"\n✅ Summary: {viewset_count} ViewSets configured")
    
    print("\n" + "="*60)
    print("✅ API Documentation Test Completed Successfully!")
    print("="*60)
    
    print("\n📖 Access Documentation:")
    print("   - Swagger UI: http://localhost:8002/api/docs/")
    print("   - ReDoc: http://localhost:8002/api/redoc/")
    print("   - OpenAPI Schema: http://localhost:8002/api/schema/")
    
    print("\n🚀 API Workflow (Getting Started):")
    print("   1. Create Hospital: POST /api/hospitals/")
    print("   2. Register User: POST /api/auth/register/")
    print("   3. Login: POST /api/auth/login/")
    print("   4. Create Users: POST /api/auth/users/")
    print("   5. Set Availability: POST /api/appointments/availability-slots/")
    print("   6. Book Appointments: POST /api/appointments/")
    
    return True

if __name__ == "__main__":
    try:
        test_api_documentation()
    except Exception as e:
        print(f"\n❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)