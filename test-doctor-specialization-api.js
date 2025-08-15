/**
 * Test script for doctor specialization API
 * This tests that the doctor endpoints return specialization information
 */

const baseUrl = 'http://localhost:8002';

// Test function to check doctor endpoints
async function testDoctorSpecializationAPI() {
  console.log('🔍 Testing Doctor Specialization API...\n');
  
  try {
    // 1. First, login as admin to get auth token
    console.log('1. Logging in as admin...');
    const loginResponse = await fetch(`${baseUrl}/api/auth/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@medcor.ai',
        password: 'admin123'
      })
    });
    
    if (!loginResponse.ok) {
      console.error('❌ Failed to login:', loginResponse.status);
      return;
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.tokens?.access;
    console.log('✅ Login successful, got token\n');
    
    // 2. Test GET /api/auth/users/doctors endpoint
    console.log('2. Testing GET /api/auth/users/doctors...');
    const doctorsResponse = await fetch(`${baseUrl}/api/auth/users/doctors/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (doctorsResponse.ok) {
      const doctors = await doctorsResponse.json();
      console.log(`✅ Found ${doctors.length} doctors`);
      
      if (doctors.length > 0) {
        const firstDoctor = doctors[0];
        console.log('\nFirst doctor details:');
        console.log('- Name:', firstDoctor.first_name, firstDoctor.last_name);
        console.log('- Email:', firstDoctor.email);
        console.log('- Role:', firstDoctor.role);
        
        // Check for specialization fields
        if (firstDoctor.doctor_specialties) {
          console.log('- Specialties:', JSON.stringify(firstDoctor.doctor_specialties, null, 2));
        } else {
          console.log('- Specialties: No specialties field found');
        }
        
        if (firstDoctor.primary_specialty) {
          console.log('- Primary Specialty:', JSON.stringify(firstDoctor.primary_specialty, null, 2));
        } else {
          console.log('- Primary Specialty: No primary specialty found');
        }
      }
    } else {
      console.error('❌ Failed to get doctors:', doctorsResponse.status);
    }
    
    // 3. Test individual doctor retrieval
    console.log('\n3. Testing individual doctor retrieval...');
    
    // First get list of users to find a doctor ID
    const usersResponse = await fetch(`${baseUrl}/api/auth/users/?role=doctor`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (usersResponse.ok) {
      const users = await usersResponse.json();
      if (users.results && users.results.length > 0) {
        const doctorId = users.results[0].id;
        console.log(`Found doctor with ID: ${doctorId}`);
        
        // Get individual doctor details
        const doctorResponse = await fetch(`${baseUrl}/api/auth/users/${doctorId}/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (doctorResponse.ok) {
          const doctor = await doctorResponse.json();
          console.log('\n✅ Individual doctor details:');
          console.log('- Name:', doctor.first_name, doctor.last_name);
          console.log('- Email:', doctor.email);
          console.log('- Role:', doctor.role);
          
          if (doctor.doctor_specialties) {
            console.log('- All Specialties:', JSON.stringify(doctor.doctor_specialties, null, 2));
          }
          
          if (doctor.primary_specialty) {
            console.log('- Primary Specialty:', JSON.stringify(doctor.primary_specialty, null, 2));
          }
          
          if (doctor.specialties) {
            console.log('- Specialties (from DoctorSerializer):', JSON.stringify(doctor.specialties, null, 2));
          }
        } else {
          console.error('❌ Failed to get individual doctor:', doctorResponse.status);
        }
      }
    }
    
    // 4. Test current user profile (if logged in as doctor)
    console.log('\n4. Testing profile endpoint...');
    const profileResponse = await fetch(`${baseUrl}/api/auth/profile/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (profileResponse.ok) {
      const profile = await profileResponse.json();
      console.log('✅ Current user profile:');
      console.log('- Role:', profile.role);
      
      if (profile.role === 'doctor') {
        console.log('- Doctor specialties:', profile.doctor_specialties);
        console.log('- Primary specialty:', profile.primary_specialty);
      } else {
        console.log('- User is not a doctor, specialties not applicable');
      }
    }
    
    console.log('\n✅ All tests completed!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  }
}

// Run the test
testDoctorSpecializationAPI();