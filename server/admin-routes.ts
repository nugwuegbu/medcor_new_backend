import type { Express, Request, Response } from "express";
import fetch from "node-fetch";

// Type definitions for Django API responses
interface DjangoUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  date_joined: string;
  last_login?: string;
}

interface DjangoAuthResponse {
  access: string;
  refresh: string;
  user: DjangoUser;
}

interface DjangoVerifyTokenResponse {
  user: DjangoUser;
}

// Admin authentication middleware - temporary standalone solution
const adminAuth = async (req: any, res: Response, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    // Temporary token validation
    if (token.startsWith('temp-admin-token-')) {
      req.user = {
        id: 1,
        email: 'admin@medcor.ai',
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin',
        is_active: true
      };
      next();
    } else {
      return res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export function registerAdminRoutes(app: Express) {
  // Admin login endpoint - temporary standalone solution
  app.post("/api/admin/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      // Temporary admin credentials check
      if (email === 'admin@medcor.ai' && password === 'admin123') {
        // Create a temporary JWT token for admin access
        const token = 'temp-admin-token-' + Date.now();
        
        res.json({
          message: 'Login successful',
          access_token: token,
          user: {
            id: 1,
            email: 'admin@medcor.ai',
            first_name: 'Admin',
            last_name: 'User',
            role: 'admin',
            is_active: true,
            date_joined: new Date().toISOString(),
            last_login: new Date().toISOString()
          }
        });
      } else {
        res.status(401).json({ error: 'Invalid credentials' });
      }
    } catch (error) {
      console.error('Admin login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  // Admin profile endpoint
  app.get("/api/admin/profile", adminAuth, async (req: any, res: Response) => {
    try {
      const user = req.user;
      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt
        }
      });
    } catch (error) {
      console.error('Admin profile error:', error);
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  });

  // Admin statistics endpoint - temporary mock data
  app.get("/api/admin/stats", adminAuth, async (req: Request, res: Response) => {
    try {
      // Return mock statistics until Django backend is fully operational
      res.json({
        totalPatients: 25,
        totalDoctors: 6,
        totalAppointments: 12,
        pendingAppointments: 3,
        todayAppointments: 2,
        monthlyGrowth: 8
      });
    } catch (error) {
      console.error('Admin stats error:', error);
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  });

  // Admin users endpoint - temporary mock data
  app.get("/api/admin/users", adminAuth, async (req: Request, res: Response) => {
    try {
      // Return mock user data until Django backend is fully operational
      const mockUsers = [
        {
          id: 1,
          name: 'Admin User',
          email: 'admin@medcor.ai',
          role: 'admin',
          isActive: true,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        },
        {
          id: 2,
          name: 'Dr. Emily Rodriguez',
          email: 'doctor@medcor.ai',
          role: 'doctor',
          isActive: true,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        },
        {
          id: 3,
          name: 'Test Patient',
          email: 'patient@medcor.ai',
          role: 'patient',
          isActive: true,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        }
      ];

      res.json(mockUsers);
    } catch (error) {
      console.error('Admin users error:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  // Admin logout endpoint
  app.post("/api/admin/logout", adminAuth, async (req: Request, res: Response) => {
    try {
      // In a stateless JWT setup, logout is handled client-side by removing the token
      res.json({ message: 'Logout successful' });
    } catch (error) {
      console.error('Admin logout error:', error);
      res.status(500).json({ error: 'Logout failed' });
    }
  });

  // Tenant management endpoints (for the multi-tenant admin functionality)
  app.get("/api/admin/tenants", adminAuth, async (req: Request, res: Response) => {
    try {
      // For now, return mock data since we're focusing on the admin interface
      // This would be replaced with actual tenant data from the Django multi-tenant system
      const mockTenants = [
        {
          id: 1,
          name: "MedCare Hospital",
          schema_name: "medcare_hospital",
          created_on: new Date().toISOString(),
          domains: [
            { domain: "medcare.localhost", is_primary: true }
          ]
        }
      ];

      res.json({
        total_tenants: 1,
        total_domains: 1,
        active_tenants: 1,
        recent_tenants: mockTenants,
        tenant_growth: {
          [new Date().toISOString().split('T')[0]]: 1
        }
      });
    } catch (error) {
      console.error('Admin tenants error:', error);
      res.status(500).json({ error: 'Failed to fetch tenant data' });
    }
  });
}