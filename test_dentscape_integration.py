#!/usr/bin/env python3
"""
Test script for Dentscape AI Integration
"""

import os
import sys
import django
import requests
import json
from pathlib import Path

# Add the project root to Python path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medcor_backend2.settings')
django.setup()

from dentscape.dentscape_client import DentscapeClient, DentscapeAPIError


def test_dentscape_client():
    """Test Dentscape client functionality"""
    print("Testing Dentscape AI Integration...")
    print("=" * 50)
    
    # Initialize client
    client = DentscapeClient()
    print(f"✓ Dentscape client initialized")
    print(f"  - API Key configured: {bool(client.api_key)}")
    print(f"  - Mock mode: {client.mock_mode}")
    print(f"  - Base URL: {client.base_url}")
    
    # Test image validation
    print("\nTesting image validation...")
    try:
        # Create a dummy image file for testing
        from PIL import Image
        import tempfile
        
        # Create a test image
        test_image = Image.new('RGB', (1000, 1000), color='white')
        with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as tmp_file:
            test_image.save(tmp_file.name, 'JPEG')
            
            # Test validation
            validation = client._validate_image_requirements(tmp_file.name, "orthodontics")
            print(f"✓ Image validation test completed")
            print(f"  - Valid: {validation['valid']}")
            print(f"  - Overall score: {validation['overall_score']}")
            
            # Clean up
            os.unlink(tmp_file.name)
            
    except Exception as e:
        print(f"✗ Image validation test failed: {str(e)}")
    
    # Test simulation methods
    print("\nTesting simulation methods...")
    simulation_methods = [
        ('simulate_orthodontics', 'Orthodontics Simulation'),
        ('simulate_veneer_with_whitening', 'Veneer with Whitening Simulation'),
        ('simulate_tooth_whitening', 'Tooth Whitening Simulation')
    ]
    
    for method_name, description in simulation_methods:
        try:
            method = getattr(client, method_name)
            print(f"✓ {description} method available")
        except AttributeError:
            print(f"✗ {description} method not found")
    
    # Test analysis methods
    print("\nTesting analysis methods...")
    analysis_methods = [
        ('analyze_smile_curve_upper', 'Smile Curve Upper Analysis'),
        ('analyze_e_line', 'E-line Analysis'),
        ('analyze_tooth_segmentation', 'Tooth Segmentation Analysis'),
        ('analyze_width_height_ratio_incisors', 'Width to Height Ratio Incisors Analysis'),
        ('analyze_incisal_plane', 'Incisal Plane Analysis'),
        ('analyze_interdental_width_proportion', 'Interdental Width Proportion Analysis')
    ]
    
    for method_name, description in analysis_methods:
        try:
            method = getattr(client, method_name)
            print(f"✓ {description} method available")
        except AttributeError:
            print(f"✗ {description} method not found")
    
    print("\n" + "=" * 50)
    print("Dentscape AI Integration test completed!")


def test_api_endpoints():
    """Test API endpoints availability"""
    print("\nTesting API endpoints...")
    print("=" * 50)
    
    base_url = "http://localhost:8002/api/dentscape"
    
    # Test endpoints
    endpoints = [
        ("/simulations/orthodontics/", "POST", "Orthodontics Simulation"),
        ("/simulations/veneer-with-whitening/", "POST", "Veneer with Whitening Simulation"),
        ("/simulations/tooth-whitening/", "POST", "Tooth Whitening Simulation"),
        ("/analyses/smile-curve-upper/", "POST", "Smile Curve Upper Analysis"),
        ("/analyses/e-line/", "POST", "E-line Analysis"),
        ("/analyses/tooth-segmentation/", "POST", "Tooth Segmentation Analysis"),
        ("/analyses/width-height-ratio-incisors/", "POST", "Width to Height Ratio Incisors Analysis"),
        ("/analyses/incisal-plane/", "POST", "Incisal Plane Analysis"),
        ("/analyses/interdental-width-proportion/", "POST", "Interdental Width Proportion Analysis"),
        ("/history/", "GET", "History Endpoint")
    ]
    
    for endpoint, method, description in endpoints:
        try:
            url = f"{base_url}{endpoint}"
            if method == "GET":
                response = requests.get(url, timeout=5)
            else:
                response = requests.post(url, timeout=5)
            
            if response.status_code in [200, 400, 405]:  # 405 is Method Not Allowed for GET on POST endpoints
                print(f"✓ {description} endpoint available")
            else:
                print(f"✗ {description} endpoint returned status {response.status_code}")
                
        except requests.exceptions.ConnectionError:
            print(f"✗ {description} endpoint not accessible (server not running)")
        except Exception as e:
            print(f"✗ {description} endpoint test failed: {str(e)}")
    
    print("\n" + "=" * 50)
    print("API endpoints test completed!")


def test_models():
    """Test Django models"""
    print("\nTesting Django models...")
    print("=" * 50)
    
    try:
        from dentscape.models import DentscapeSimulation, DentscapeAnalysis, DentscapeHistory
        
        # Test model creation
        simulation = DentscapeSimulation(
            tracking_user_id="test_user_123",
            simulation_type="orthodontics"
        )
        print(f"✓ DentscapeSimulation model created")
        
        analysis = DentscapeAnalysis(
            tracking_user_id="test_user_123",
            analysis_type="smile_curve_upper"
        )
        print(f"✓ DentscapeAnalysis model created")
        
        history = DentscapeHistory(
            tracking_user_id="test_user_123"
        )
        print(f"✓ DentscapeHistory model created")
        
        # Test model methods
        print(f"✓ Simulation can retry: {simulation.can_retry}")
        print(f"✓ Analysis is completed: {analysis.is_completed}")
        
    except Exception as e:
        print(f"✗ Model test failed: {str(e)}")
    
    print("\n" + "=" * 50)
    print("Django models test completed!")


if __name__ == "__main__":
    print("Dentscape AI Integration Test Suite")
    print("=" * 60)
    
    # Run tests
    test_dentscape_client()
    test_models()
    test_api_endpoints()
    
    print("\n" + "=" * 60)
    print("All tests completed!")
    print("\nTo test the API endpoints with actual requests:")
    print("1. Start the Django server: python3 manage.py runserver")
    print("2. Use the Swagger UI at: http://localhost:8002/api/docs/")
    print("3. Or use curl commands as shown in the documentation")





