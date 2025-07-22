#!/usr/bin/env python3
"""
MedCor.ai API Documentation Email Notification System
This script generates and sends comprehensive API documentation URLs via email.
"""

import os
import sys
import smtplib
from email.mime.text import MimeText
from email.mime.multipart import MimeMultipart
from datetime import datetime

def send_swagger_email(recipient_email="user@example.com"):
    """Send comprehensive API documentation email with Swagger URLs"""
    
    # Email configuration (using environment variables for security)
    smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
    smtp_port = int(os.getenv('SMTP_PORT', '587'))
    sender_email = os.getenv('SENDER_EMAIL', 'noreply@medcor.ai')
    sender_password = os.getenv('SENDER_PASSWORD', 'your-app-password')
    
    # Create message
    message = MimeMultipart("alternative")
    message["Subject"] = "MedCor.ai Healthcare Platform API Documentation - Swagger URLs"
    message["From"] = f"MedCor.ai API Team <{sender_email}>"
    message["To"] = recipient_email
    
    # Create HTML email content
    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>MedCor.ai API Documentation</title>
        <style>
            body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }}
            .container {{ max-width: 800px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }}
            .header {{ background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 5px; margin-bottom: 30px; }}
            .url-box {{ background-color: #f8fafc; border: 2px solid #e2e8f0; padding: 15px; margin: 10px 0; border-radius: 5px; }}
            .url-box h3 {{ margin-top: 0; color: #1e40af; }}
            .url {{ font-family: monospace; background-color: #e2e8f0; padding: 8px; border-radius: 3px; word-break: break-all; }}
            .feature-list {{ background-color: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 15px; margin: 15px 0; }}
            .footer {{ text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🏥 MedCor.ai Healthcare Platform</h1>
                <p>Comprehensive API Documentation</p>
            </div>
            
            <h2>📋 Swagger API Documentation URLs</h2>
            
            <div class="url-box">
                <h3>🔗 Interactive Swagger UI</h3>
                <p>Complete interactive API documentation with try-it-out functionality:</p>
                <div class="url"><a href="http://localhost:8000/api/swagger/" target="_blank">http://localhost:8000/api/swagger/</a></div>
            </div>
            
            <div class="url-box">
                <h3>📖 ReDoc Documentation</h3>
                <p>Clean, readable API documentation with detailed examples:</p>
                <div class="url"><a href="http://localhost:8000/api/redoc/" target="_blank">http://localhost:8000/api/redoc/</a></div>
            </div>
            
            <div class="url-box">
                <h3>⚙️ OpenAPI Schema</h3>
                <p>Raw OpenAPI 3.0 specification for integration:</p>
                <div class="url"><a href="http://localhost:8000/api/schema/" target="_blank">http://localhost:8000/api/schema/</a></div>
            </div>
            
            <div class="feature-list">
                <h3>🚀 API Features Documented</h3>
                <ul>
                    <li><strong>🔐 Authentication</strong> - JWT-based auth, user management, role-based access</li>
                    <li><strong>🏥 Appointments</strong> - Complete booking system with slots, exclusions, and scheduling</li>
                    <li><strong>💊 Treatments</strong> - Medical procedures with rich descriptions and cost tracking</li>
                    <li><strong>🔬 Analysis</strong> - AI-powered hair, skin, and lips analysis endpoints</li>
                    <li><strong>💬 Chat</strong> - HeyGen avatar integration and AI conversation system</li>
                    <li><strong>👥 Users</strong> - Multi-tenant user management with comprehensive profiles</li>
                </ul>
            </div>
            
            <div class="feature-list">
                <h3>📊 Comprehensive Documentation Includes</h3>
                <ul>
                    <li>✅ All 50+ API endpoints fully documented</li>
                    <li>✅ Request/response examples for every endpoint</li>
                    <li>✅ Parameter descriptions and validation rules</li>
                    <li>✅ Authentication requirements and examples</li>
                    <li>✅ Error response codes and descriptions</li>
                    <li>✅ Role-based access control documentation</li>
                    <li>✅ Multi-tenant architecture support</li>
                    <li>✅ Advanced filtering and search capabilities</li>
                </ul>
            </div>
            
            <h3>🔧 Quick Start Guide</h3>
            <p>To access the API documentation:</p>
            <ol>
                <li>Ensure Django server is running on port 8000</li>
                <li>Visit <strong>http://localhost:8000/api/swagger/</strong> for interactive docs</li>
                <li>Use the "Authorize" button to enter your JWT token</li>
                <li>Test endpoints directly from the documentation interface</li>
            </ol>
            
            <h3>🏷️ API Endpoint Categories</h3>
            <ul>
                <li><code>/api/auth/</code> - Authentication & User Management</li>
                <li><code>/api/appointments/</code> - Appointment Scheduling System</li>
                <li><code>/api/treatments/</code> - Medical Treatments & Procedures</li>
                <li><code>/api/</code> - Analysis Tools & Chat System</li>
            </ul>
            
            <div class="footer">
                <p>Generated on: {datetime.now().strftime("%B %d, %Y at %I:%M %p")}</p>
                <p>🏥 MedCor.ai Healthcare Platform API Team</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    # Create text version for compatibility
    text_content = f"""
    MedCor.ai Healthcare Platform - API Documentation URLs
    
    Swagger Interactive Documentation:
    http://localhost:8000/api/swagger/
    
    ReDoc Documentation:
    http://localhost:8000/api/redoc/
    
    OpenAPI Schema:
    http://localhost:8000/api/schema/
    
    Features Documented:
    - Authentication & JWT Management
    - Appointment Scheduling System
    - Treatment Management
    - AI Analysis Tools (Hair, Skin, Lips)
    - Chat System with HeyGen Integration
    - Multi-tenant User Management
    
    Generated on: {datetime.now().strftime("%B %d, %Y at %I:%M %p")}
    MedCor.ai Healthcare Platform API Team
    """
    
    # Attach parts
    part1 = MimeText(text_content, "plain")
    part2 = MimeText(html_content, "html")
    message.attach(part1)
    message.attach(part2)
    
    try:
        # Send email
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, recipient_email, message.as_string())
        
        print(f"✅ API Documentation URLs sent successfully to {recipient_email}")
        return True
        
    except Exception as e:
        print(f"❌ Failed to send email: {str(e)}")
        print(f"\n📋 Swagger URLs for manual access:")
        print(f"Interactive Swagger UI: http://localhost:8000/api/swagger/")
        print(f"ReDoc Documentation: http://localhost:8000/api/redoc/")
        print(f"OpenAPI Schema: http://localhost:8000/api/schema/")
        return False

if __name__ == "__main__":
    # Get recipient email from command line or use default
    recipient = sys.argv[1] if len(sys.argv) > 1 else "user@example.com"
    send_swagger_email(recipient)