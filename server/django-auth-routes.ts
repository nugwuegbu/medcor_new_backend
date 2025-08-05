import express from 'express';
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';

const router = express.Router();

const DJANGO_API_URL = process.env.DJANGO_API_URL || 'https://14b294fa-eeaf-46d5-a262-7c25b42c30d9-00-m9ex3vzr6khq.sisko.replit.dev:8000';

// Login endpoint that proxies to Django
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Forward request to Django backend
    const response = await fetch(`${DJANGO_API_URL}/api/auth/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data: any = await response.json();

    if (response.ok) {
      // Django returns the user data and token
      res.json({
        token: data.access,
        user: data.user,
        refresh: data.refresh
      });
    } else {
      res.status(response.status).json(data);
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout endpoint
router.post('/auth/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      // Forward logout request to Django
      const response = await fetch(`${DJANGO_API_URL}/api/auth/logout/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        res.json({ message: 'Logged out successfully' });
      } else {
        res.status(response.status).json({ error: 'Logout failed' });
      }
    } else {
      res.json({ message: 'No token provided' });
    }
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user profile
router.get('/auth/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Forward request to Django
    const response = await fetch(`${DJANGO_API_URL}/api/auth/user/`, {
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
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user (me) endpoint
router.get('/auth/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Forward request to Django to get current user
    const response = await fetch(`${DJANGO_API_URL}/api/auth/user/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      res.json(data);
    } else {
      res.status(401).json({ error: 'Invalid token', message: 'Authentication failed' });
    }
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify token endpoint
router.get('/auth/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify token with Django backend
    const response = await fetch(`${DJANGO_API_URL}/api/auth/profile/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const user = await response.json();
      res.json({ valid: true, user });
    } else {
      res.status(401).json({ valid: false, error: 'Invalid token' });
    }
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all appointments (proxy to Django)
router.get('/appointments/appointments', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const response = await fetch(`${DJANGO_API_URL}/api/appointments/appointments/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data: any = await response.json();

    if (response.ok) {
      res.json(data);
    } else {
      res.status(response.status).json(data);
    }
  } catch (error) {
    console.error('Appointments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get today's appointments (proxy to Django)
router.get('/appointments/appointments/today', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const response = await fetch(`${DJANGO_API_URL}/api/appointments/appointments/today/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data: any = await response.json();

    if (response.ok) {
      res.json(data);
    } else {
      res.status(response.status).json(data);
    }
  } catch (error) {
    console.error('Today appointments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get upcoming appointments (proxy to Django)
router.get('/appointments/appointments/upcoming', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const response = await fetch(`${DJANGO_API_URL}/api/appointments/appointments/upcoming/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data: any = await response.json();

    if (response.ok) {
      res.json(data);
    } else {
      res.status(response.status).json(data);
    }
  } catch (error) {
    console.error('Upcoming appointments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get appointment statistics (proxy to Django)
router.get('/appointments/appointments/statistics', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const response = await fetch(`${DJANGO_API_URL}/api/appointments/appointments/statistics/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data: any = await response.json();

    if (response.ok) {
      res.json(data);
    } else {
      res.status(response.status).json(data);
    }
  } catch (error) {
    console.error('Statistics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create appointment (proxy to Django)
router.post('/appointments/appointments', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const response = await fetch(`${DJANGO_API_URL}/api/appointments/appointments/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    const data: any = await response.json();

    if (response.ok) {
      res.json(data);
    } else {
      res.status(response.status).json(data);
    }
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update appointment status (proxy to Django)
router.patch('/appointments/appointments/:id/update_status', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const { id } = req.params;
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const response = await fetch(`${DJANGO_API_URL}/api/appointments/appointments/${id}/update_status/`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    const data: any = await response.json();

    if (response.ok) {
      res.json(data);
    } else {
      res.status(response.status).json(data);
    }
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users (proxy to Django)
router.get('/auth/users', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const response = await fetch(`${DJANGO_API_URL}/api/auth/users/`, {
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
    console.error('Users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get doctor slots (proxy to Django)
router.get('/appointments/slots', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const response = await fetch(`${DJANGO_API_URL}/api/appointments/slots/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data: any = await response.json();

    if (response.ok) {
      res.json(data);
    } else {
      res.status(response.status).json(data);
    }
  } catch (error) {
    console.error('Slots error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create treatment (proxy to Django)
router.post('/treatments', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

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
    console.error('Create treatment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get treatments (proxy to Django)
router.get('/treatments', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

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
    console.error('Treatments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;