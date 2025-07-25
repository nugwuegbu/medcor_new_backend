#!/usr/bin/env python3
import os
import sys
import time
import threading
import signal
from django.core.management import execute_from_command_line

# Ensure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medcor_backend.settings')

# Setup signal handlers
def signal_handler(sig, frame):
    print('Django server stopping...')
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

def force_django_server():
    """Force Django to start and stay running"""
    print("🏥 Force Starting Django Admin Server")
    print("=" * 50)
    
    try:
        import django
        django.setup()
        print("✅ Django setup complete")
        
        # Test admin route
        from django.test import Client
        client = Client()
        response = client.get('/admin/')
        print(f"✅ Admin route test: {response.status_code} (redirect to login)")
        
        # Start server with forced settings
        print("🚀 Starting Django server on 0.0.0.0:8000...")
        sys.argv = [
            'manage.py', 
            'runserver', 
            '0.0.0.0:8000',
            '--noreload',
            '--nothreading',
            '--verbosity=2'
        ]
        
        # Force execution
        execute_from_command_line(sys.argv)
        
    except KeyboardInterrupt:
        print("\n🛑 Server stopped")
    except Exception as e:
        print(f"❌ Django error: {e}")
        import traceback
        traceback.print_exc()
        # Keep trying
        time.sleep(5)
        force_django_server()

if __name__ == '__main__':
    force_django_server()