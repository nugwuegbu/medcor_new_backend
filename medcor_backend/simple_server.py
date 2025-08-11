#!/usr/bin/env python
"""
Simple Django API server for MedCor - Temporary fallback when Neon DB is disabled
Provides basic API endpoints for the chat widget interface
"""

import json
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import hashlib
import time

# In-memory storage for temporary use
USERS = {
    "admin": {
        "id": 1,
        "username": "admin",
        "email": "admin@medcor.ai",
        "password_hash": hashlib.sha256("admin123".encode()).hexdigest(),
        "role": "admin"
    }
}

MEDICAL_RECORDS = []
SESSION_TOKENS = {}

class MedCorAPIHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

    def do_GET(self):
        """Handle GET requests"""
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        path = urlparse(self.path).path
        
        if path == '/api/':
            response = {"message": "MedCor API Server (Temporary SQLite Mode)", "status": "running"}
        elif path == '/api/medical-records/':
            response = MEDICAL_RECORDS
        elif path == '/api/auth/user/':
            # Return mock user for now
            response = {"id": 1, "username": "test_user", "email": "user@medcor.ai"}
        else:
            response = {"error": "Not found"}
        
        self.wfile.write(json.dumps(response).encode())

    def do_POST(self):
        """Handle POST requests"""
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        path = urlparse(self.path).path
        
        if path == '/api/auth/login/':
            try:
                data = json.loads(post_data)
                username = data.get('username')
                password = data.get('password')
                
                if username in USERS:
                    user = USERS[username]
                    if hashlib.sha256(password.encode()).hexdigest() == user['password_hash']:
                        token = hashlib.sha256(f"{username}{time.time()}".encode()).hexdigest()
                        SESSION_TOKENS[token] = username
                        response = {
                            "access": token,
                            "refresh": token,
                            "user": {
                                "id": user["id"],
                                "username": user["username"],
                                "email": user["email"]
                            }
                        }
                    else:
                        response = {"error": "Invalid credentials"}
                else:
                    response = {"error": "Invalid credentials"}
            except:
                response = {"error": "Invalid request"}
        elif path == '/api/medical-records/':
            try:
                data = json.loads(post_data)
                record = {
                    "id": len(MEDICAL_RECORDS) + 1,
                    "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
                    **data
                }
                MEDICAL_RECORDS.append(record)
                response = record
            except:
                response = {"error": "Invalid data"}
        else:
            response = {"message": "OK"}
        
        self.wfile.write(json.dumps(response).encode())

    def do_PUT(self):
        """Handle PUT requests"""
        self.do_POST()  # Same handling for now

    def do_DELETE(self):
        """Handle DELETE requests"""
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        path = urlparse(self.path).path
        
        if '/api/medical-records/' in path:
            # Extract ID from path
            parts = path.split('/')
            if len(parts) >= 4:
                try:
                    record_id = int(parts[3])
                    MEDICAL_RECORDS[:] = [r for r in MEDICAL_RECORDS if r.get('id') != record_id]
                    response = {"success": True}
                except:
                    response = {"error": "Invalid ID"}
            else:
                response = {"error": "ID required"}
        else:
            response = {"message": "OK"}
        
        self.wfile.write(json.dumps(response).encode())

    def log_message(self, format, *args):
        """Suppress default logging"""
        pass

if __name__ == "__main__":
    print("=" * 60)
    print("🚨 TEMPORARY MEDCOR API SERVER")
    print("Running on port 8000 (SQLite fallback mode)")
    print("=" * 60)
    print("To restore full functionality:")
    print("1. Go to https://console.neon.tech/")
    print("2. Enable endpoint: ep-odd-darkness-aeh1zc2l")
    print("=" * 60)
    
    server = HTTPServer(('0.0.0.0', 8000), MedCorAPIHandler)
    print("Server started on http://localhost:8000")
    server.serve_forever()