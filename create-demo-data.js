// Script to create demo data for doctor and patient dashboards
import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

// Helper function to login and get token
async function login(email, password) {
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, { email, password });
    return response.data.token;
  } catch (error) {
    console.error(`Login failed for ${email}:`, error.response?.data || error.message);
    return null;
  }
}

// Helper function to get user info
async function getUser(token) {
  try {
    const response = await axios.get(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.user;
  } catch (error) {
    console.error('Failed to get user info:', error.response?.data || error.message);
    return null;
  }
}

// Create appointments
async function createAppointments(token, doctorId, patientId) {
  const appointments = [
    {
      doctor: doctorId,
      patient: patientId,
      appointment_date: new Date().toISOString().split('T')[0], // Today
      appointment_time: '10:00:00',
      reason: 'Regular checkup',
      status: 'scheduled',
      notes: 'Patient reports mild headache'
    },
    {
      doctor: doctorId,
      patient: patientId,
      appointment_date: new Date().toISOString().split('T')[0], // Today
      appointment_time: '14:00:00',
      reason: 'Follow-up consultation',
      status: 'in_progress',
      notes: 'Review blood test results'
    },
    {
      doctor: doctorId,
      patient: patientId,
      appointment_date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
      appointment_time: '11:00:00',
      reason: 'Flu symptoms',
      status: 'completed',
      notes: 'Patient had fever and cough'
    },
    {
      doctor: doctorId,
      patient: patientId,
      appointment_date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0], // 2 days ago
      appointment_time: '09:00:00',
      reason: 'Annual physical exam',
      status: 'completed',
      notes: 'Overall health assessment'
    },
    {
      doctor: doctorId,
      patient: patientId,
      appointment_date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
      appointment_time: '15:00:00',
      reason: 'Vaccination',
      status: 'scheduled',
      notes: 'COVID booster shot'
    },
    {
      doctor: doctorId,
      patient: patientId,
      appointment_date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0], // Day after tomorrow
      appointment_time: '16:00:00',
      reason: 'Dermatology consultation',
      status: 'scheduled',
      notes: 'Skin rash examination'
    }
  ];

  const createdAppointments = [];
  
  for (const appointment of appointments) {
    try {
      const response = await axios.post(`${BASE_URL}/api/appointments/appointments/`, appointment, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      createdAppointments.push(response.data);
      console.log(`✓ Created appointment: ${appointment.reason} on ${appointment.appointment_date}`);
    } catch (error) {
      console.error(`✗ Failed to create appointment:`, error.response?.data || error.message);
    }
  }
  
  return createdAppointments;
}

// Create treatments for completed appointments
async function createTreatments(token, appointments) {
  const treatments = [
    {
      diagnosis: 'Influenza Type A',
      prescription: 'Tamiflu 75mg - Take twice daily for 5 days\nAcetaminophen 500mg - As needed for fever\nRest and plenty of fluids',
      notes: 'Patient should return if symptoms worsen. Contagious period discussed.',
      follow_up_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
    },
    {
      diagnosis: 'General good health',
      prescription: 'Multivitamin - Once daily\nVitamin D 1000IU - Once daily\nContinue regular exercise routine',
      notes: 'All vital signs normal. Cholesterol slightly elevated - monitor diet.',
      follow_up_date: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0]
    }
  ];

  const completedAppointments = appointments.filter(apt => apt.status === 'completed');
  
  for (let i = 0; i < completedAppointments.length && i < treatments.length; i++) {
    try {
      const treatmentData = {
        appointment: completedAppointments[i].id,
        ...treatments[i]
      };
      
      await axios.post(`${BASE_URL}/api/treatments/`, treatmentData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log(`✓ Created treatment for appointment ID ${completedAppointments[i].id}`);
    } catch (error) {
      console.error(`✗ Failed to create treatment:`, error.response?.data || error.message);
    }
  }
}

// Update patient profile with additional information
async function updatePatientProfile(token, patientId) {
  const profileData = {
    date_of_birth: '1990-05-15',
    blood_type: 'O+',
    allergies: 'Penicillin, Pollen',
    emergency_contact: 'Jane Doe - +1 (555) 123-4567',
    medical_history: 'Asthma (mild), Appendectomy (2015)'
  };

  try {
    await axios.patch(`${BASE_URL}/api/tenants/users/${patientId}/`, profileData, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log(`✓ Updated patient profile`);
  } catch (error) {
    console.error(`✗ Failed to update patient profile:`, error.response?.data || error.message);
  }
}

// Create demo messages for chat
async function createDemoMessages(token, patientId, doctorId) {
  const messages = [
    {
      sender_id: patientId,
      receiver_id: doctorId,
      message: 'Hello Dr. Smith, I have a question about my prescription.',
      timestamp: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
    },
    {
      sender_id: doctorId,
      receiver_id: patientId,
      message: 'Of course! What would you like to know about your medication?',
      timestamp: new Date(Date.now() - 3300000).toISOString() // 55 minutes ago
    },
    {
      sender_id: patientId,
      receiver_id: doctorId,
      message: 'Should I take it with food or on an empty stomach?',
      timestamp: new Date(Date.now() - 3000000).toISOString() // 50 minutes ago
    },
    {
      sender_id: doctorId,
      receiver_id: patientId,
      message: 'Take it with food to avoid stomach upset. Also, make sure to complete the full course even if you feel better.',
      timestamp: new Date(Date.now() - 2700000).toISOString() // 45 minutes ago
    }
  ];

  for (const message of messages) {
    try {
      await axios.post(`${BASE_URL}/api/messages/`, message, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log(`✓ Created chat message`);
    } catch (error) {
      // Messages endpoint might not exist yet, skip silently
    }
  }
}

// Main function to create all demo data
async function createDemoData() {
  console.log('Creating demo data for MedCor platform...\n');

  // Login as doctor first to get doctor user info
  const doctorToken = await login('doctor@medcor.ai', 'Doctor123!');
  if (!doctorToken) {
    console.error('Failed to login as doctor. Make sure the server is running.');
    return;
  }

  // Login as patient to get patient user info
  const patientToken = await login('patient@medcor.ai', 'Patient123!');
  if (!patientToken) {
    console.error('Failed to login as patient.');
    return;
  }

  // Get doctor and patient info
  try {
    const doctorUser = await getUser(doctorToken);
    const patientUser = await getUser(patientToken);
    
    if (!doctorUser || !patientUser) {
      console.error('Could not get user information');
      return;
    }

    console.log(`Found doctor: ${doctorUser.username} (ID: ${doctorUser.id})`);
    console.log(`Found patient: ${patientUser.username} (ID: ${patientUser.id})\n`);

    // Create appointments
    console.log('Creating appointments...');
    const appointments = await createAppointments(doctorToken, doctorUser.id, patientUser.id);
    
    // Create treatments for completed appointments
    console.log('\nCreating treatments...');
    await createTreatments(doctorToken, appointments);
    
    // Update patient profile
    console.log('\nUpdating patient profile...');
    await updatePatientProfile(patientToken, patientUser.id);
    
    // Create demo chat messages
    console.log('\nCreating demo messages...');
    await createDemoMessages(doctorToken, patientUser.id, doctorUser.id);
    
    console.log('\n✅ Demo data creation completed!');
    console.log('\nYou can now login with:');
    console.log('- Patient: patient@medcor.ai / Patient123!');
    console.log('- Doctor: doctor@medcor.ai / Doctor123!');
    
  } catch (error) {
    console.error('Error creating demo data:', error.response?.data || error.message);
  }
}

// Run the script
createDemoData().catch(console.error);