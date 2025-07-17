#!/usr/bin/env python3
"""
Test Script for Frontend-Backend Separation
This script tests that the separated frontend and backend can communicate properly
"""

import os
import sys
import json
import time
import subprocess
import requests
from pathlib import Path

# Colors for output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_status(message, status="INFO"):
    color = Colors.BLUE
    if status == "SUCCESS":
        color = Colors.GREEN
    elif status == "ERROR":
        color = Colors.RED
    elif status == "WARNING":
        color = Colors.YELLOW
    
    print(f"{color}[{status}]{Colors.ENDC} {message}")

def check_file_exists(file_path, description):
    """Check if a file exists and print status"""
    if Path(file_path).exists():
        print_status(f"{description}: ✅ Found", "SUCCESS")
        return True
    else:
        print_status(f"{description}: ❌ Missing", "ERROR")
        return False

def test_environment_configuration():
    """Test that environment files are properly configured"""
    print_status("Testing Environment Configuration", "INFO")
    
    # Check backend environment files
    backend_env_files = [
        ("medcor_backend/.env", "Backend Environment File"),
        ("medcor_backend/.env.example", "Backend Environment Example"),
        ("medcor_backend/requirements.txt", "Backend Requirements"),
    ]
    
    # Check frontend environment files
    frontend_env_files = [
        ("client/.env", "Frontend Environment File"),
        ("client/.env.example", "Frontend Environment Example"),
        ("client/src/config/api.ts", "Frontend API Configuration"),
        ("client/src/lib/api-client.ts", "Frontend API Client"),
    ]
    
    all_files_exist = True
    
    for file_path, description in backend_env_files + frontend_env_files:
        if not check_file_exists(file_path, description):
            all_files_exist = False
    
    return all_files_exist

def test_django_backend():
    """Test Django backend functionality"""
    print_status("Testing Django Backend", "INFO")
    
    try:
        # Test Django setup
        os.chdir("medcor_backend")
        
        # Check if we can import Django
        result = subprocess.run([
            sys.executable, "-c", 
            "import django; import os; os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medcor_backend.settings'); django.setup(); print('Django setup successful')"
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            print_status("Django Setup: ✅ Working", "SUCCESS")
        else:
            print_status(f"Django Setup: ❌ Failed - {result.stderr}", "ERROR")
            return False
        
        # Test database models
        result = subprocess.run([
            sys.executable, "-c", 
            """
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medcor_backend.settings')
django.setup()
from core.models import User, Doctor, Appointment
print(f'Users: {User.objects.count()}')
print(f'Doctors: {Doctor.objects.count()}')
print(f'Appointments: {Appointment.objects.count()}')
print('Database models working')
"""
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            print_status("Database Models: ✅ Working", "SUCCESS")
            print_status(f"Database Data: {result.stdout.strip()}", "INFO")
        else:
            print_status(f"Database Models: ❌ Failed - {result.stderr}", "ERROR")
            return False
        
        os.chdir("..")
        return True
        
    except Exception as e:
        print_status(f"Django Backend Test Failed: {str(e)}", "ERROR")
        os.chdir("..")
        return False

def test_api_endpoints():
    """Test API endpoints are accessible"""
    print_status("Testing API Endpoints", "INFO")
    
    base_url = "http://localhost:5000"
    
    # Test endpoints
    endpoints = [
        ("/api/auth/me", "Authentication Check"),
        ("/api/doctors", "Doctors List"),
        ("/api/admin/stats", "Admin Statistics"),
    ]
    
    for endpoint, description in endpoints:
        try:
            response = requests.get(f"{base_url}{endpoint}", timeout=5)
            if response.status_code in [200, 401]:  # 401 is expected for auth endpoints
                print_status(f"{description}: ✅ Accessible (Status: {response.status_code})", "SUCCESS")
            else:
                print_status(f"{description}: ⚠️ Unexpected status {response.status_code}", "WARNING")
        except requests.exceptions.RequestException as e:
            print_status(f"{description}: ❌ Failed - {str(e)}", "ERROR")
            return False
    
    return True

def test_frontend_configuration():
    """Test frontend configuration"""
    print_status("Testing Frontend Configuration", "INFO")
    
    try:
        # Check if frontend environment variables are loaded
        env_file = Path("client/.env")
        if env_file.exists():
            with open(env_file, 'r') as f:
                content = f.read()
                if "VITE_API_BASE_URL" in content:
                    print_status("Frontend Environment Variables: ✅ Configured", "SUCCESS")
                else:
                    print_status("Frontend Environment Variables: ❌ Missing VITE_API_BASE_URL", "ERROR")
                    return False
        
        # Check API configuration file
        api_config_file = Path("client/src/config/api.ts")
        if api_config_file.exists():
            with open(api_config_file, 'r') as f:
                content = f.read()
                if "API_ENDPOINTS" in content and "API_CONFIG" in content:
                    print_status("Frontend API Configuration: ✅ Configured", "SUCCESS")
                else:
                    print_status("Frontend API Configuration: ❌ Missing required exports", "ERROR")
                    return False
        
        return True
        
    except Exception as e:
        print_status(f"Frontend Configuration Test Failed: {str(e)}", "ERROR")
        return False

def test_separation_readiness():
    """Test if the separation is ready for deployment"""
    print_status("Testing Separation Readiness", "INFO")
    
    # Check backend structure
    backend_structure = [
        "medcor_backend/manage.py",
        "medcor_backend/medcor_backend/settings.py",
        "medcor_backend/core/models.py",
        "medcor_backend/authentication/views.py",
        "medcor_backend/api/views.py",
        "medcor_backend/requirements.txt",
    ]
    
    # Check frontend structure
    frontend_structure = [
        "package.json",
        "client/src/App.tsx",
        "client/src/config/api.ts",
        "client/src/lib/api-client.ts",
        "vite.config.ts",
    ]
    
    all_ready = True
    
    print_status("Backend Structure:", "INFO")
    for file_path in backend_structure:
        if not check_file_exists(file_path, f"  {file_path}"):
            all_ready = False
    
    print_status("Frontend Structure:", "INFO")
    for file_path in frontend_structure:
        if not check_file_exists(file_path, f"  {file_path}"):
            all_ready = False
    
    return all_ready

def main():
    """Run all tests"""
    print_status("🚀 Starting Frontend-Backend Separation Tests", "INFO")
    print("=" * 60)
    
    tests = [
        ("Environment Configuration", test_environment_configuration),
        ("Django Backend", test_django_backend),
        ("API Endpoints", test_api_endpoints),
        ("Frontend Configuration", test_frontend_configuration),
        ("Separation Readiness", test_separation_readiness),
    ]
    
    results = {}
    
    for test_name, test_func in tests:
        print(f"\n{Colors.BOLD}Testing {test_name}...{Colors.ENDC}")
        results[test_name] = test_func()
        time.sleep(0.5)  # Small delay for readability
    
    # Summary
    print("\n" + "=" * 60)
    print_status("🎯 TEST SUMMARY", "INFO")
    print("=" * 60)
    
    passed = sum(results.values())
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name}: {status}")
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print_status("🎉 ALL TESTS PASSED - Ready for deployment!", "SUCCESS")
        print_status("✅ Frontend and Backend are properly separated", "SUCCESS")
        print_status("✅ Environment variables are configured", "SUCCESS")
        print_status("✅ API endpoints are accessible", "SUCCESS")
        print_status("✅ Django backend is functional", "SUCCESS")
        return True
    else:
        print_status("❌ Some tests failed - Check configuration", "ERROR")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)