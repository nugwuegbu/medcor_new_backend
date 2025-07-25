#!/usr/bin/env python3
"""
Standalone Django Admin Server for MedCor Healthcare Platform
Run this script to start the Django admin interface on port 8000
"""
import os
import sys
import socket
import subprocess
import time

def check_port_available(port):
    """Check if a port is available"""
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    result = sock.connect_ex(('127.0.0.1', port))
    sock.close()
    return result != 0

def start_django_admin():
    """Start the Django admin server"""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medcor_backend.settings')
    
    print("🏥 MedCor Django Admin Server")
    print("=" * 50)
    
    # Check if port 8000 is available
    if not check_port_available(8000):
        print("❌ Port 8000 is already in use")
        print("   Please stop the existing service or use a different port")
        return False
    
    try:
        # Start Django server
        print("🚀 Starting Django development server...")
        print("📋 Admin URL: http://localhost:8000/admin/")
        print("🔑 Login: admin@localhost / admin123")
        print("=" * 50)
        
        # Use subprocess to start Django server
        cmd = [sys.executable, 'manage.py', 'runserver', '0.0.0.0:8000', '--noreload']
        process = subprocess.Popen(cmd, 
                                 stdout=subprocess.PIPE, 
                                 stderr=subprocess.STDOUT,
                                 universal_newlines=True,
                                 bufsize=1)
        
        # Print output in real-time
        for line in process.stdout:
            print(f"[django] {line.strip()}")
            
        return True
        
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
        return True
    except Exception as e:
        print(f"❌ Error starting Django server: {e}")
        return False

if __name__ == '__main__':
    success = start_django_admin()
    sys.exit(0 if success else 1)