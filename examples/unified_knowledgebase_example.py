#!/usr/bin/env python3
"""
Example script demonstrating the unified KnowledgeBase API usage.
This script shows how to interact with the new unified endpoint.
"""

import requests
import json
import uuid

# Configuration
BASE_URL = "https://api.medcor.ai/api/knowledgebase"
HOSPITAL_ID = "123e4567-e89b-12d3-a456-426614174000"  # Replace with actual hospital ID
AUTH_TOKEN = "your_auth_token_here"  # Replace with actual auth token

# Headers
headers = {
    "Authorization": f"Bearer {AUTH_TOKEN}",
    "Content-Type": "application/json"
}

def create_knowledge_base():
    """Create a new KnowledgeBase for a hospital"""
    url = f"{BASE_URL}/hospital/{HOSPITAL_ID}/knowledge-base/"
    
    data = {
        "agent_name": "MedCor AI Assistant",
        "agent_title": "AI Medical Assistant",
        "system_prompt": "You are a helpful AI medical assistant for MedCor Hospital.",
        "communication_tone": "Professional",
        "communication_style": "Conversational",
        "confidence_level": "Balanced",
        "response_length": "Medium",
        "greeting_message": "Hello! I'm your AI medical assistant. How can I help you today?",
        "appointment_booking": "I can help you book an appointment. Please let me know your preferred date and time.",
        "face_analysis": "I can help analyze facial features. Please describe what you'd like me to look at.",
        "hair_analysis": "I can help analyze hair conditions. Please describe your hair concerns.",
        "hair_extension_analysis": "I can help analyze hair extensions. Please describe your extension concerns.",
        "lips_analysis": "I can help analyze lip conditions. Please describe your lip concerns.",
        "skin_analysis": "I can help analyze skin conditions. Please describe your skin concerns.",
        "general_inquiries": "I'm here to help with your medical inquiries. What would you like to know?",
        "fallback_response": "I'm not sure how to help with that. Please contact our medical staff for assistance.",
        "emergency_response": "This appears to be a medical emergency. Please call emergency services immediately or go to the nearest emergency room.",
        "business_hours": "Our business hours are Monday-Friday 9AM-5PM. Please contact us during these hours.",
        "medical_specialties": "We offer various medical specialties. Please let me know what specific area you're interested in.",
        "is_active": True
    }
    
    try:
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error creating knowledge base: {e}")
        return None

def get_knowledge_base():
    """Retrieve KnowledgeBase for a hospital (auto-creates if doesn't exist)"""
    url = f"{BASE_URL}/hospital/{HOSPITAL_ID}/knowledge-base/"
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error retrieving knowledge base: {e}")
        return None

def update_knowledge_base(knowledge_base_id):
    """Update an existing KnowledgeBase"""
    url = f"{BASE_URL}/hospital/{HOSPITAL_ID}/knowledge-base/{knowledge_base_id}/"
    
    data = {
        "communication_tone": "Empathic",
        "greeting_message": "Welcome to MedCor Hospital! I'm here to help you with your medical needs.",
        "appointment_booking": "I'd be happy to help you schedule an appointment. What type of consultation are you looking for?"
    }
    
    try:
        response = requests.patch(url, headers=headers, json=data)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error updating knowledge base: {e}")
        return None

def upload_source_file(knowledge_base_id, file_path):
    """Upload a source file to the KnowledgeBase"""
    url = f"{BASE_URL}/hospital/{HOSPITAL_ID}/knowledge-base/{knowledge_base_id}/"
    
    files = {
        'source_file': open(file_path, 'rb')
    }
    
    # Remove Content-Type header for file upload
    file_headers = {k: v for k, v in headers.items() if k != 'Content-Type'}
    
    try:
        response = requests.patch(url, headers=file_headers, files=files)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error uploading file: {e}")
        return None
    finally:
        files['source_file'].close()

def activate_knowledge_base(knowledge_base_id):
    """Activate a KnowledgeBase"""
    url = f"{BASE_URL}/hospital/{HOSPITAL_ID}/knowledge-base/{knowledge_base_id}/activate/"
    
    try:
        response = requests.post(url, headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error activating knowledge base: {e}")
        return None

def deactivate_knowledge_base(knowledge_base_id):
    """Deactivate a KnowledgeBase"""
    url = f"{BASE_URL}/hospital/{HOSPITAL_ID}/knowledge-base/{knowledge_base_id}/deactivate/"
    
    try:
        response = requests.post(url, headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error deactivating knowledge base: {e}")
        return None

def download_source_file(knowledge_base_id):
    """Download the source file from KnowledgeBase"""
    url = f"{BASE_URL}/hospital/{HOSPITAL_ID}/knowledge-base/{knowledge_base_id}/download_file/"
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        # Save the file
        filename = f"downloaded_file_{knowledge_base_id}.pdf"
        with open(filename, 'wb') as f:
            f.write(response.content)
        
        print(f"File downloaded as: {filename}")
        return filename
    except requests.exceptions.RequestException as e:
        print(f"Error downloading file: {e}")
        return None

def main():
    """Main function demonstrating the unified KnowledgeBase API"""
    print("=== Unified KnowledgeBase API Example ===\n")
    
    # 1. Get or create KnowledgeBase (auto-creates if doesn't exist)
    print("1. Retrieving KnowledgeBase...")
    knowledge_base = get_knowledge_base()
    if knowledge_base:
        print("✓ KnowledgeBase retrieved successfully")
        print(f"   ID: {knowledge_base['id']}")
        print(f"   Agent Name: {knowledge_base['agent_name']}")
        print(f"   Communication Tone: {knowledge_base['communication_tone']}")
    else:
        print("✗ Failed to retrieve KnowledgeBase")
        return
    
    knowledge_base_id = knowledge_base['id']
    
    # 2. Update KnowledgeBase
    print("\n2. Updating KnowledgeBase...")
    updated_kb = update_knowledge_base(knowledge_base_id)
    if updated_kb:
        print("✓ KnowledgeBase updated successfully")
        print(f"   New Communication Tone: {updated_kb['communication_tone']}")
        print(f"   New Greeting Message: {updated_kb['greeting_message'][:50]}...")
    else:
        print("✗ Failed to update KnowledgeBase")
    
    # 3. Activate KnowledgeBase
    print("\n3. Activating KnowledgeBase...")
    activation_result = activate_knowledge_base(knowledge_base_id)
    if activation_result:
        print("✓ KnowledgeBase activated successfully")
        print(f"   Active Status: {activation_result['is_active']}")
    else:
        print("✗ Failed to activate KnowledgeBase")
    
    # 4. Upload source file (if you have a file to upload)
    print("\n4. Uploading source file...")
    # Uncomment the following lines if you have a file to upload
    # file_path = "path/to/your/source/file.pdf"
    # upload_result = upload_source_file(knowledge_base_id, file_path)
    # if upload_result:
    #     print("✓ Source file uploaded successfully")
    #     print(f"   File Name: {upload_result['file_name']}")
    #     print(f"   File Size: {upload_result['file_size']} bytes")
    # else:
    #     print("✗ Failed to upload source file")
    print("   (Skipped - no file provided)")
    
    # 5. Download source file (if one exists)
    print("\n5. Downloading source file...")
    downloaded_file = download_source_file(knowledge_base_id)
    if downloaded_file:
        print(f"✓ Source file downloaded successfully: {downloaded_file}")
    else:
        print("   (No file to download or download failed)")
    
    # 6. Deactivate KnowledgeBase
    print("\n6. Deactivating KnowledgeBase...")
    deactivation_result = deactivate_knowledge_base(knowledge_base_id)
    if deactivation_result:
        print("✓ KnowledgeBase deactivated successfully")
        print(f"   Active Status: {deactivation_result['is_active']}")
    else:
        print("✗ Failed to deactivate KnowledgeBase")
    
    print("\n=== Example completed ===")

if __name__ == "__main__":
    main()