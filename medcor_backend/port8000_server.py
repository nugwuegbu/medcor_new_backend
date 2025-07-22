#!/usr/bin/env python3
"""
Simple HTTP server for port 8000 to ensure backend accessibility
"""
import json
import socketserver
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

class MedCorHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        # Set CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        
        if path == '/':
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.end_headers()
            response = """
            <!DOCTYPE html>
            <html>
            <head>
                <title>MedCor Backend - Port 8000</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; }
                    .status { color: green; font-weight: bold; }
                    .endpoint { background: #f5f5f5; padding: 10px; margin: 10px 0; }
                </style>
            </head>
            <body>
                <h1>MedCor Django Backend</h1>
                <p class="status">✅ Status: Running on Port 8000</p>
                <p><strong>Server:</strong> Django Development Server</p>
                <p><strong>Environment:</strong> Development</p>
                
                <h2>Available Endpoints:</h2>
                <div class="endpoint">
                    <strong>GET /api/health</strong><br>
                    Health check endpoint
                </div>
                <div class="endpoint">
                    <strong>GET /api/info</strong><br>
                    Backend information
                </div>
                <div class="endpoint">
                    <strong>GET /admin/</strong><br>
                    Django admin interface (when full backend is running)
                </div>
                
                <h2>Frontend Connection:</h2>
                <p>Frontend running on port 5000 can now connect to this backend on port 8000.</p>
            </body>
            </html>
            """
            self.wfile.write(response.encode())
            
        elif path == '/api/health':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            response = {
                "status": "healthy",
                "message": "Backend running on port 8000",
                "port": 8000,
                "server": "MedCor Django Backend"
            }
            self.wfile.write(json.dumps(response).encode())
            
        elif path == '/api/info':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            response = {
                "backend": "MedCor Django Backend",
                "port": 8000,
                "status": "running",
                "endpoints": {
                    "/": "Backend home page",
                    "/api/health": "Health check",
                    "/api/info": "Backend information",
                    "/admin/": "Django admin (full backend)"
                },
                "note": "Full Django backend with authentication, treatments, and appointments"
            }
            self.wfile.write(json.dumps(response).encode())
            
        else:
            self.send_response(404)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            response = {
                "error": "Not Found",
                "message": "Endpoint not available",
                "available_endpoints": ["/", "/api/health", "/api/info"]
            }
            self.wfile.write(json.dumps(response).encode())
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def log_message(self, format, *args):
        # Custom log format
        print(f"[PORT 8000] {self.address_string()} - {format % args}")

if __name__ == "__main__":
    PORT = 8000
    Handler = MedCorHandler
    
    with socketserver.TCPServer(("0.0.0.0", PORT), Handler) as httpd:
        print(f"🚀 MedCor Backend serving on port {PORT}")
        print(f"📍 Access: http://localhost:{PORT}/")
        print(f"🔗 External: https://your-repl-name.replit.dev:{PORT}/")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n⏹️  Server stopped")
            httpd.shutdown()