import type { Express, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "./db";
import { users, doctors, appointments } from "@shared/schema";
import { eq, count, desc, gte } from "drizzle-orm";

// Admin authentication middleware
const adminAuth = async (req: any, res: Response, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    
    const [user] = await db.select().from(users).where(eq(users.id, decoded.userId));
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export function registerAdminRoutes(app: Express) {
  // Admin login endpoint
  app.post("/api/admin/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      // Find admin user
      const [user] = await db.select().from(users).where(eq(users.email, email));
      
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check password
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check if user is admin
      if (user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '24h' }
      );

      res.json({
        message: 'Login successful',
        access_token: token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isActive: user.isActive
        }
      });
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

  // Admin statistics endpoint
  app.get("/api/admin/stats", adminAuth, async (req: Request, res: Response) => {
    try {
      // Get user counts by role
      const totalPatients = await db.select({ count: count() })
        .from(users)
        .where(eq(users.role, 'patient'));
      
      const totalDoctors = await db.select({ count: count() })
        .from(doctors);
      
      const totalAppointments = await db.select({ count: count() })
        .from(appointments);
      
      const pendingAppointments = await db.select({ count: count() })
        .from(appointments)
        .where(eq(appointments.status, 'pending'));

      // Get today's appointments
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayAppointments = await db.select({ count: count() })
        .from(appointments)
        .where(gte(appointments.appointmentDate, today));

      res.json({
        totalPatients: totalPatients[0]?.count || 0,
        totalDoctors: totalDoctors[0]?.count || 0,
        totalAppointments: totalAppointments[0]?.count || 0,
        pendingAppointments: pendingAppointments[0]?.count || 0,
        todayAppointments: todayAppointments[0]?.count || 0,
        monthlyGrowth: 15 // TODO: Calculate actual monthly growth
      });
    } catch (error) {
      console.error('Admin stats error:', error);
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  });

  // Admin users endpoint
  app.get("/api/admin/users", adminAuth, async (req: Request, res: Response) => {
    try {
      const allUsers = await db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
        lastLogin: users.lastLogin
      }).from(users).orderBy(desc(users.createdAt));

      res.json(allUsers);
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