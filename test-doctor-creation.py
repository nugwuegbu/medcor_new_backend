import requests
import json

# Step 1: Admin login
login_url = "http://localhost:8000/api/auth/login"
admin_creds = {"email": "admin@medcor.ai", "password": "admin123"}

login_response = requests.post(login_url, json=admin_creds)
if login_response.status_code == 200:
    token = login_response.json()['token']
    print("✅ Admin logged in successfully")
    print(f"Admin role: {login_response.json()['user']['role']}")
    
    # Step 2: Create a new doctor
    create_doctor_url = "http://localhost:8000/api/doctors/create"
    new_doctor = {
        "email": "test.doctor@medcor.ai",
        "password": "TempPass123!",
        "firstName": "Test",
        "lastName": "Doctor",
        "specialization": "General Practice",
        "experience": 5,
        "qualifications": "MD"
    }
    
    headers = {"Authorization": f"Token {token}"}
    create_response = requests.post(create_doctor_url, json=new_doctor, headers=headers)
    
    if create_response.status_code in [200, 201]:
        print("✅ Doctor created successfully")
        
        # Step 3: Test login with new doctor
        doctor_login = requests.post(login_url, json={
            "email": "test.doctor@medcor.ai",
            "password": "TempPass123!"
        })
        
        if doctor_login.status_code == 200:
            doctor_data = doctor_login.json()
            print(f"✅ New doctor logged in successfully")
            print(f"Doctor role returned: {doctor_data['user']['role']}")
            
            if doctor_data['user']['role'] == 'doctor':
                print("\n🎉 SUCCESS: Doctor role mapping is working correctly!")
            else:
                print(f"\n❌ ERROR: Expected 'doctor' but got '{doctor_data['user']['role']}'")
        else:
            print(f"❌ Doctor login failed: {doctor_login.text}")
    else:
        print(f"Doctor creation response: {create_response.status_code}")
        print(f"Response: {create_response.text}")
else:
    print(f"❌ Admin login failed: {login_response.text}")
