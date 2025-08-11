#!/usr/bin/env python
"""
Simple Django API server for when Neon database is disabled
Provides basic endpoints without multi-tenancy
"""

import os
import sys
import json
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import hashlib
import datetime

# Mock database - in-memory storage
users_db = {
    "admin@medcor.ai": {
        "id": 1,
        "email": "admin@medcor.ai", 
        "password": hashlib.sha256("admin123".encode()).hexdigest(),
        "role": "admin",
        "firstName": "Admin",
        "lastName": "User"
    },
    "doctor@medcor.ai": {
        "id": 2,
        "email": "doctor@medcor.ai",
        "password": hashlib.sha256("doctor123".encode()).hexdigest(),
        "role": "doctor",
        "firstName": "Dr. John",
        "lastName": "Smith"
    },
    "patient@medcor.ai": {
        "id": 3,
        "email": "patient@medcor.ai",
        "password": hashlib.sha256("patient123".encode()).hexdigest(),
        "role": "patient",
        "firstName": "Jane",
        "lastName": "Doe"
    }
}

sessions = {}

class APIHandler(BaseHTTPRequestHandler):
    def _set_headers(self, status=200, content_type='application/json'):
        self.send_response(status)
        self.send_header('Content-Type', content_type)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers(200)

    def do_GET(self):
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        if path == '/api/' or path == '/api':
            self._set_headers()
            response = {
                "message": "MedCor Backend API (Fallback Mode)",
                "status": "running",
                "mode": "fallback",
                "database": "in-memory",
                "note": "Neon database is disabled. Using simple fallback server.",
                "endpoints": [
                    "/api/auth/login",
                    "/api/auth/logout", 
                    "/api/auth/user",
                    "/api/doctors",
                    "/api/appointments"
                ]
            }
            self.wfile.write(json.dumps(response).encode())
            
        elif path == '/api/auth/user':
            # Get current user
            auth_header = self.headers.get('Authorization')
            if auth_header and auth_header.startswith('Bearer '):
                token = auth_header[7:]
                if token in sessions:
                    user = sessions[token]
                    self._set_headers()
                    self.wfile.write(json.dumps(user).encode())
                else:
                    self._set_headers(401)
                    self.wfile.write(json.dumps({"error": "Invalid token"}).encode())
            else:
                self._set_headers(401)
                self.wfile.write(json.dumps({"error": "No authorization"}).encode())
                
        elif path == '/api/doctors' or path == '/api/doctors/':
            # List doctors
            doctors = [
                {
                    "id": 1,
                    "name": "Dr. John Smith",
                    "specialization": "General Practice",
                    "experience": 10,
                    "rating": 4.8,
                    "availability": "Monday-Friday"
                },
                {
                    "id": 2,
                    "name": "Dr. Emily Johnson",
                    "specialization": "Cardiology",
                    "experience": 15,
                    "rating": 4.9,
                    "availability": "Tuesday-Saturday"
                }
            ]
            self._set_headers()
            self.wfile.write(json.dumps(doctors).encode())
            
        elif path == '/api/appointments' or path == '/api/appointments/':
            # List appointments
            appointments = [
                {
                    "id": 1,
                    "patientName": "Jane Doe",
                    "doctorName": "Dr. John Smith",
                    "date": "2025-01-15",
                    "time": "10:00 AM",
                    "status": "scheduled"
                }
            ]
            self._set_headers()
            self.wfile.write(json.dumps(appointments).encode())
            
        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({"error": "Not found"}).encode())

    def do_POST(self):
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        if path == '/api/auth/login' or path == '/api/auth/login/':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            email = data.get('email')
            password = data.get('password')
            
            if email in users_db:
                user = users_db[email]
                hashed_password = hashlib.sha256(password.encode()).hexdigest()
                
                if user['password'] == hashed_password:
                    # Create session token
                    token = hashlib.sha256(f"{email}{datetime.datetime.now()}".encode()).hexdigest()
                    sessions[token] = {
                        "id": user['id'],
                        "email": user['email'],
                        "role": user['role'],
                        "firstName": user['firstName'],
                        "lastName": user['lastName']
                    }
                    
                    self._set_headers()
                    response = {
                        "token": token,
                        "user": sessions[token],
                        "message": "Login successful"
                    }
                    self.wfile.write(json.dumps(response).encode())
                else:
                    self._set_headers(401)
                    self.wfile.write(json.dumps({"error": "Invalid credentials"}).encode())
            else:
                self._set_headers(401)
                self.wfile.write(json.dumps({"error": "User not found"}).encode())
                
        elif path == '/api/auth/logout' or path == '/api/auth/logout/':
            auth_header = self.headers.get('Authorization')
            if auth_header and auth_header.startswith('Bearer '):
                token = auth_header[7:]
                if token in sessions:
                    del sessions[token]
                    
            self._set_headers()
            self.wfile.write(json.dumps({"message": "Logged out"}).encode())
            
        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({"error": "Not found"}).encode())

    def log_message(self, format, *args):
        # Suppress default logging
        pass

def main():
    port = 8000
    server = HTTPServer(('0.0.0.0', port), APIHandler)
    
    print(f"📦 Simple API Server (Fallback Mode)")
    print(f"⚠️  Neon database is disabled - using in-memory storage")
    print(f"📝 To restore full functionality: Enable your database at https://console.neon.tech/")
    print(f"🚀 Server running on http://localhost:{port}")
    print(f"")
    print(f"Test credentials:")
    print(f"  - admin@medcor.ai / admin123")
    print(f"  - doctor@medcor.ai / doctor123")
    print(f"  - patient@medcor.ai / patient123")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        server.shutdown()

if __name__ == '__main__':
    main()