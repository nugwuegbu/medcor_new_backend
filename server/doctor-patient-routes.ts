import express from 'express';
import { authenticateToken, type AuthenticatedRequest } from './middleware/auth';
import { storage } from './storage';

const router = express.Router();

// Mock data for development
const mockDoctorStats = {
  totalPatients: 45,
  appointmentsToday: 8,
  appointmentsThisWeek: 32,
  completedAppointments: 156,
  upcomingAppointments: 12,
  revenue: 45000,
  averageRating: 4.8,
  newPatientsThisMonth: 15
};

// Doctor Statistics
router.get('/doctors/statistics', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    // Return mock statistics for now
    res.json(mockDoctorStats);
  } catch (error) {
    console.error('Error fetching doctor statistics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Doctor's Patients
router.get('/doctors/patients', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    // Return mock patients list
    const mockPatients = [
      {
        id: 1,
        name: "Jane Doe",
        email: "patient@medcor.ai",
        age: 32,
        lastVisit: "2025-01-08",
        condition: "General Checkup",
        status: "Active"
      },
      {
        id: 2,
        name: "John Smith",
        email: "john.smith@example.com",
        age: 45,
        lastVisit: "2025-01-05",
        condition: "Diabetes Management",
        status: "Active"
      },
      {
        id: 3,
        name: "Sarah Johnson",
        email: "sarah.j@example.com",
        age: 28,
        lastVisit: "2024-12-20",
        condition: "Allergy Treatment",
        status: "Active"
      }
    ];
    res.json(mockPatients);
  } catch (error) {
    console.error('Error fetching doctor patients:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Available Doctors (for patients)
router.get('/doctors/available', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    // Return mock available doctors
    const mockDoctors = [
      {
        id: 1,
        name: "Dr. John Smith",
        email: "doctor@medcor.ai",
        specialty: "General Medicine",
        experience: "10 years",
        rating: 4.8,
        availability: "Available",
        nextSlot: "Today, 3:00 PM"
      },
      {
        id: 2,
        name: "Dr. Emily Brown",
        email: "emily.brown@medcor.ai",
        specialty: "Cardiology",
        experience: "15 years",
        rating: 4.9,
        availability: "Available",
        nextSlot: "Tomorrow, 10:00 AM"
      },
      {
        id: 3,
        name: "Dr. Michael Chen",
        email: "michael.chen@medcor.ai",
        specialty: "Pediatrics",
        experience: "8 years",
        rating: 4.7,
        availability: "Busy",
        nextSlot: "Jan 10, 2:00 PM"
      }
    ];
    res.json(mockDoctors);
  } catch (error) {
    console.error('Error fetching available doctors:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Appointment Slots
router.get('/appointments/slots', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    // Return mock appointment slots
    const mockSlots = [
      { id: 1, time: "09:00 AM", available: true, date: req.query.date || "2025-01-11" },
      { id: 2, time: "09:30 AM", available: true, date: req.query.date || "2025-01-11" },
      { id: 3, time: "10:00 AM", available: false, date: req.query.date || "2025-01-11" },
      { id: 4, time: "10:30 AM", available: true, date: req.query.date || "2025-01-11" },
      { id: 5, time: "11:00 AM", available: true, date: req.query.date || "2025-01-11" },
      { id: 6, time: "02:00 PM", available: true, date: req.query.date || "2025-01-11" },
      { id: 7, time: "02:30 PM", available: false, date: req.query.date || "2025-01-11" },
      { id: 8, time: "03:00 PM", available: true, date: req.query.date || "2025-01-11" }
    ];
    res.json(mockSlots);
  } catch (error) {
    console.error('Error fetching appointment slots:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Available Slots
router.get('/slots/available', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    // Return mock available slots
    const mockAvailableSlots = [
      { id: 1, time: "09:00 AM", doctorId: req.query.doctor_id || 1, date: req.query.date || "2025-01-11" },
      { id: 2, time: "09:30 AM", doctorId: req.query.doctor_id || 1, date: req.query.date || "2025-01-11" },
      { id: 4, time: "10:30 AM", doctorId: req.query.doctor_id || 1, date: req.query.date || "2025-01-11" },
      { id: 5, time: "11:00 AM", doctorId: req.query.doctor_id || 1, date: req.query.date || "2025-01-11" },
      { id: 6, time: "02:00 PM", doctorId: req.query.doctor_id || 1, date: req.query.date || "2025-01-11" },
      { id: 8, time: "03:00 PM", doctorId: req.query.doctor_id || 1, date: req.query.date || "2025-01-11" }
    ];
    res.json(mockAvailableSlots);
  } catch (error) {
    console.error('Error fetching available slots:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all appointments
router.get('/appointments', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    // Return mock appointments
    const mockAppointments = [
      {
        id: 1,
        patient: "Jane Doe",
        doctor: "Dr. John Smith",
        date: "2025-01-11",
        time: "10:00 AM",
        status: "Scheduled",
        reason: "General Checkup",
        type: "In-Person"
      },
      {
        id: 2,
        patient: "John Smith", 
        doctor: "Dr. Emily Brown",
        date: "2025-01-11",
        time: "2:00 PM",
        status: "Scheduled",
        reason: "Follow-up",
        type: "Virtual"
      },
      {
        id: 3,
        patient: "Sarah Johnson",
        doctor: "Dr. John Smith",
        date: "2025-01-10",
        time: "11:00 AM",
        status: "Completed",
        reason: "Allergy Consultation",
        type: "In-Person"
      }
    ];
    res.json(mockAppointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get upcoming appointments
router.get('/appointments/upcoming', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    // Return mock upcoming appointments
    const mockUpcomingAppointments = [
      {
        id: 1,
        patient: "Jane Doe",
        doctor: "Dr. John Smith",
        date: "2025-01-11",
        time: "10:00 AM",
        status: "Scheduled",
        reason: "General Checkup",
        type: "In-Person",
        duration: "30 mins"
      },
      {
        id: 2,
        patient: "John Smith",
        doctor: "Dr. Emily Brown",
        date: "2025-01-11",
        time: "2:00 PM",
        status: "Scheduled",
        reason: "Follow-up",
        type: "Virtual",
        duration: "15 mins"
      }
    ];
    res.json(mockUpcomingAppointments);
  } catch (error) {
    console.error('Error fetching upcoming appointments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create appointment
router.post('/appointments', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    // Create mock appointment response
    const newAppointment = {
      id: Date.now(),
      ...req.body,
      status: "Scheduled",
      createdAt: new Date().toISOString()
    };
    res.status(201).json(newAppointment);
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete appointment
router.delete('/appointments/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    // Mock successful deletion
    console.log(`Deleting appointment with id: ${id}`);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start Appointment
router.post('/appointments/:id/start', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    // Mock starting appointment
    const updatedAppointment = {
      id,
      status: "In Progress",
      startedAt: new Date().toISOString()
    };
    res.json(updatedAppointment);
  } catch (error) {
    console.error('Error starting appointment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cancel Appointment
router.post('/appointments/:id/cancel', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    // Mock cancelling appointment
    const updatedAppointment = {
      id,
      status: "Cancelled",
      cancelledAt: new Date().toISOString()
    };
    res.json(updatedAppointment);
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Patient's Appointments History
router.get('/appointments/history', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    // Return mock appointment history
    const mockHistory = [
      {
        id: 1,
        doctor: "Dr. John Smith",
        date: "2024-12-15",
        time: "10:00 AM",
        status: "Completed",
        reason: "Annual Checkup",
        diagnosis: "Good health",
        prescription: "Multivitamins"
      },
      {
        id: 2,
        doctor: "Dr. Emily Brown",
        date: "2024-11-20",
        time: "2:00 PM",
        status: "Completed",
        reason: "Flu symptoms",
        diagnosis: "Common cold",
        prescription: "Rest and fluids"
      },
      {
        id: 3,
        doctor: "Dr. Michael Chen",
        date: "2024-10-10",
        time: "11:30 AM",
        status: "Completed",
        reason: "Back pain",
        diagnosis: "Muscle strain",
        prescription: "Physical therapy"
      }
    ];
    res.json(mockHistory);
  } catch (error) {
    console.error('Error fetching appointment history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// My Treatments (for patients)
router.get('/treatments/my', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    // Return mock treatments for patient
    const mockTreatments = [
      {
        id: 1,
        date: "2025-01-08",
        doctor: "Dr. John Smith",
        diagnosis: "Common Cold",
        treatment: "Rest and hydration",
        prescription: "Paracetamol 500mg",
        followUp: "2025-01-15"
      },
      {
        id: 2,
        date: "2024-12-20",
        doctor: "Dr. Emily Brown",
        diagnosis: "Hypertension",
        treatment: "Lifestyle changes",
        prescription: "Amlodipine 5mg",
        followUp: "2025-02-01"
      }
    ];
    res.json(mockTreatments);
  } catch (error) {
    console.error('Error fetching my treatments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// All Treatments (for doctors)
router.get('/treatments', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    // Return mock treatments for doctor
    const mockTreatments = [
      {
        id: 1,
        patient: "Jane Doe",
        date: "2025-01-08",
        diagnosis: "Common Cold",
        treatment: "Rest and hydration",
        prescription: "Paracetamol 500mg",
        status: "Active"
      },
      {
        id: 2,
        patient: "John Smith",
        date: "2025-01-07",
        diagnosis: "Diabetes Type 2",
        treatment: "Diet control",
        prescription: "Metformin 500mg",
        status: "Active"
      },
      {
        id: 3,
        patient: "Sarah Johnson",
        date: "2025-01-05",
        diagnosis: "Allergic Rhinitis",
        treatment: "Avoid allergens",
        prescription: "Cetirizine 10mg",
        status: "Completed"
      }
    ];
    res.json(mockTreatments);
  } catch (error) {
    console.error('Error fetching treatments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create Treatment
router.post('/treatments', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    // Create mock treatment response
    const newTreatment = {
      id: Date.now(),
      ...req.body,
      createdAt: new Date().toISOString(),
      status: "Active"
    };
    res.status(201).json(newTreatment);
  } catch (error) {
    console.error('Error creating treatment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// My Medical Records (for patients)
router.get('/medical-records/my', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    // Return mock medical records
    const mockMedicalRecords = [
      {
        id: 1,
        date: "2025-01-08",
        type: "Lab Report",
        title: "Complete Blood Count",
        doctor: "Dr. John Smith",
        results: "Normal",
        fileUrl: null
      },
      {
        id: 2,
        date: "2024-12-15",
        type: "X-Ray",
        title: "Chest X-Ray",
        doctor: "Dr. Emily Brown",
        results: "Clear",
        fileUrl: null
      },
      {
        id: 3,
        date: "2024-11-20",
        type: "Prescription",
        title: "Medication List",
        doctor: "Dr. Michael Chen",
        results: "See attached",
        fileUrl: null
      }
    ];
    res.json(mockMedicalRecords);
  } catch (error) {
    console.error('Error fetching medical records:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create Prescription
router.post('/prescriptions', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    // Create mock prescription response
    const newPrescription = {
      id: Date.now(),
      ...req.body,
      createdAt: new Date().toISOString(),
      doctorName: "Dr. John Smith",
      status: "Active"
    };
    res.status(201).json(newPrescription);
  } catch (error) {
    console.error('Error creating prescription:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;