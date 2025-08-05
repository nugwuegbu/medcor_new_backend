import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

const DJANGO_API_URL = process.env.DJANGO_API_URL || 'https://14b294fa-eeaf-46d5-a262-7c25b42c30d9-00-m9ex3vzr6khq.sisko.replit.dev:8000';

// Middleware to check authentication
const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  next();
};

// Doctor Statistics
router.get('/doctors/statistics', requireAuth, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const response = await fetch(`${DJANGO_API_URL}/api/doctors/statistics/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (response.ok) {
      res.json(data);
    } else {
      res.status(response.status).json(data);
    }
  } catch (error) {
    console.error('Error fetching doctor statistics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Doctor's Patients
router.get('/doctors/patients', requireAuth, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const response = await fetch(`${DJANGO_API_URL}/api/doctors/patients/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (response.ok) {
      res.json(data);
    } else {
      res.status(response.status).json(data);
    }
  } catch (error) {
    console.error('Error fetching doctor patients:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Available Doctors (for patients)
router.get('/doctors/available', requireAuth, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const response = await fetch(`${DJANGO_API_URL}/api/doctors/available/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (response.ok) {
      res.json(data);
    } else {
      res.status(response.status).json(data);
    }
  } catch (error) {
    console.error('Error fetching available doctors:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Appointment Slots
router.get('/appointments/slots', requireAuth, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const { date } = req.query;
    const url = date 
      ? `${DJANGO_API_URL}/api/appointments/slots/?date=${date}`
      : `${DJANGO_API_URL}/api/appointments/slots/`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (response.ok) {
      res.json(data);
    } else {
      res.status(response.status).json(data);
    }
  } catch (error) {
    console.error('Error fetching appointment slots:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start Appointment
router.post('/appointments/appointments/:id/start', requireAuth, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const { id } = req.params;
    
    const response = await fetch(`${DJANGO_API_URL}/api/appointments/appointments/${id}/start/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    if (response.ok) {
      res.json(data);
    } else {
      res.status(response.status).json(data);
    }
  } catch (error) {
    console.error('Error starting appointment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cancel Appointment
router.post('/appointments/appointments/:id/cancel', requireAuth, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const { id } = req.params;
    
    const response = await fetch(`${DJANGO_API_URL}/api/appointments/appointments/${id}/cancel/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    if (response.ok) {
      res.json(data);
    } else {
      res.status(response.status).json(data);
    }
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Patient's Appointments History
router.get('/appointments/appointments/history', requireAuth, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const response = await fetch(`${DJANGO_API_URL}/api/appointments/appointments/history/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (response.ok) {
      res.json(data);
    } else {
      res.status(response.status).json(data);
    }
  } catch (error) {
    console.error('Error fetching appointment history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// My Treatments (for patients)
router.get('/treatments/my', requireAuth, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const response = await fetch(`${DJANGO_API_URL}/api/treatments/my/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (response.ok) {
      res.json(data);
    } else {
      res.status(response.status).json(data);
    }
  } catch (error) {
    console.error('Error fetching my treatments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// All Treatments (for doctors)
router.get('/treatments', requireAuth, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const response = await fetch(`${DJANGO_API_URL}/api/treatments/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (response.ok) {
      res.json(data);
    } else {
      res.status(response.status).json(data);
    }
  } catch (error) {
    console.error('Error fetching treatments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create Treatment
router.post('/treatments', requireAuth, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const response = await fetch(`${DJANGO_API_URL}/api/treatments/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    if (response.ok) {
      res.json(data);
    } else {
      res.status(response.status).json(data);
    }
  } catch (error) {
    console.error('Error creating treatment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// My Medical Records (for patients)
router.get('/medical-records/my', requireAuth, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const response = await fetch(`${DJANGO_API_URL}/api/medical-records/my/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (response.ok) {
      res.json(data);
    } else {
      res.status(response.status).json(data);
    }
  } catch (error) {
    console.error('Error fetching medical records:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create Prescription
router.post('/prescriptions', requireAuth, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const response = await fetch(`${DJANGO_API_URL}/api/prescriptions/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    if (response.ok) {
      res.json(data);
    } else {
      res.status(response.status).json(data);
    }
  } catch (error) {
    console.error('Error creating prescription:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;