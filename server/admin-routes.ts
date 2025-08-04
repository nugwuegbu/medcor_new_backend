import express from 'express';
import { db } from './db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { users, tenants, subscriptions } from '@shared/schema';
import { eq, and, sql, desc } from 'drizzle-orm';
import { z } from 'zod';

const router = express.Router();

// Middleware to verify MedCor admin token
const verifyMedCorAdmin = async (req: any, res: any, next: any) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Check if user is a MedCor super admin
    const [user] = await db
      .select()
      .from(users)
      .where(and(
        eq(users.id, decoded.userId),
        eq(users.role, 'superadmin')
      ));

    if (!user) {
      return res.status(403).json({ error: 'Access denied. Super admin only.' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Get admin statistics
router.get('/admin/stats', verifyMedCorAdmin, async (req, res) => {
  try {
    // Get total tenants
    const [tenantStats] = await db
      .select({
        totalTenants: sql<number>`COUNT(*)`,
        activeTenants: sql<number>`COUNT(CASE WHEN status = 'active' THEN 1 END)`,
      })
      .from(tenants);

    // Get total users
    const [userStats] = await db
      .select({
        totalUsers: sql<number>`COUNT(*)`,
      })
      .from(users);

    // Get subscription stats
    const [subscriptionStats] = await db
      .select({
        activeSubscriptions: sql<number>`COUNT(CASE WHEN status = 'active' THEN 1 END)`,
        monthlyRevenue: sql<number>`SUM(CASE WHEN status = 'active' THEN 
          CASE plan
            WHEN 'basic' THEN 299
            WHEN 'professional' THEN 799
            ELSE 0
          END
        ELSE 0 END)`,
      })
      .from(subscriptions);

    // Calculate growth rates (mock data for now)
    const stats = {
      totalTenants: Number(tenantStats?.totalTenants) || 0,
      activeTenants: Number(tenantStats?.activeTenants) || 0,
      totalUsers: Number(userStats?.totalUsers) || 0,
      monthlyRevenue: Number(subscriptionStats?.monthlyRevenue) || 0,
      revenueGrowth: 12.5, // Mock growth rate
      userGrowth: 8.3, // Mock growth rate
      activeSubscriptions: Number(subscriptionStats?.activeSubscriptions) || 0,
      churnRate: 2.1, // Mock churn rate
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get all tenants with summary
router.get('/admin/tenants', verifyMedCorAdmin, async (req, res) => {
  try {
    const { search, status } = req.query;

    let query = db
      .select({
        id: tenants.id,
        name: tenants.name,
        domain: tenants.subdomain,
        status: tenants.status,
        lastActive: tenants.updatedAt,
        userCount: sql<number>`(SELECT COUNT(*) FROM users WHERE tenant_id = ${tenants.id})`,
      })
      .from(tenants);

    // Apply filters
    const conditions = [];
    if (status && status !== 'all') {
      conditions.push(eq(tenants.status, status as any));
    }
    if (search) {
      conditions.push(
        sql`(${tenants.name} ILIKE ${'%' + search + '%'} OR ${tenants.subdomain} ILIKE ${'%' + search + '%'})`
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const tenantList = await query.orderBy(desc(tenants.createdAt));

    // Add subscription and revenue info (simplified for now)
    const tenantsWithDetails = tenantList.map(tenant => ({
      ...tenant,
      subscription: {
        plan: 'professional',
        status: 'active',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      revenue: 799, // Mock revenue based on plan
    }));

    res.json(tenantsWithDetails);
  } catch (error) {
    console.error('Error fetching tenants:', error);
    res.status(500).json({ error: 'Failed to fetch tenants' });
  }
});

// Create new tenant
router.post('/admin/tenants', verifyMedCorAdmin, async (req, res) => {
  try {
    const createTenantSchema = z.object({
      name: z.string().min(1),
      subdomain: z.string().min(1).regex(/^[a-z0-9-]+$/),
      adminEmail: z.string().email(),
      adminPassword: z.string().min(6),
      plan: z.enum(['basic', 'professional', 'enterprise']),
    });

    const validatedData = createTenantSchema.parse(req.body);

    // Check if subdomain already exists
    const [existingTenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.subdomain, validatedData.subdomain));

    if (existingTenant) {
      return res.status(400).json({ error: 'Subdomain already exists' });
    }

    // Create tenant
    const [newTenant] = await db
      .insert(tenants)
      .values({
        name: validatedData.name,
        subdomain: validatedData.subdomain,
        status: 'active',
        settings: {},
      })
      .returning();

    // Create admin user for the tenant
    const hashedPassword = await bcrypt.hash(validatedData.adminPassword, 10);
    const [adminUser] = await db
      .insert(users)
      .values({
        username: validatedData.adminEmail.split('@')[0], // Use email prefix as username
        email: validatedData.adminEmail,
        password: hashedPassword,
        name: `Admin - ${validatedData.name}`,
        role: 'admin',
        tenantId: newTenant.id,
      })
      .returning();

    // Create subscription
    await db
      .insert(subscriptions)
      .values({
        tenantId: newTenant.id,
        plan: validatedData.plan,
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
      });

    res.json({
      tenant: newTenant,
      adminUser: { ...adminUser, password: undefined },
    });
  } catch (error) {
    console.error('Error creating tenant:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid data', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to create tenant' });
  }
});

// Update tenant status
router.patch('/admin/tenants/:id', verifyMedCorAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const [updatedTenant] = await db
      .update(tenants)
      .set({ status, updatedAt: new Date() })
      .where(eq(tenants.id, id))
      .returning();

    if (!updatedTenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    res.json(updatedTenant);
  } catch (error) {
    console.error('Error updating tenant:', error);
    res.status(500).json({ error: 'Failed to update tenant' });
  }
});

// Export admin report
router.post('/admin/export', verifyMedCorAdmin, async (req, res) => {
  try {
    const { dateRange } = req.body;
    
    // Generate CSV report (simplified version)
    const csvHeader = 'Tenant Name,Domain,Status,Users,Revenue,Last Active\n';
    
    const tenantData = await db
      .select({
        name: tenants.name,
        domain: tenants.subdomain,
        status: tenants.status,
        lastActive: tenants.updatedAt,
        userCount: sql<number>`(SELECT COUNT(*) FROM users WHERE tenant_id = ${tenants.id})`,
      })
      .from(tenants);

    const csvRows = tenantData.map(tenant => 
      `"${tenant.name}","${tenant.domain}","${tenant.status}",${tenant.userCount},799,"${tenant.lastActive}"`
    ).join('\n');

    const csvContent = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="medcor-report-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// MedCor super admin login
router.post('/admin/superadmin/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if it's the super admin
    if (email !== 'superadmin@medcor.ai') {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // For development, use a simple password check
    // In production, this should be stored securely
    const validPassword = password === 'MedCor@2025!';

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create a super admin token
    const token = jwt.sign(
      { 
        userId: 'superadmin',
        email: 'superadmin@medcor.ai',
        role: 'superadmin'
      },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: 'superadmin',
        email: 'superadmin@medcor.ai',
        role: 'superadmin',
        name: 'MedCor Admin'
      }
    });
  } catch (error) {
    console.error('Super admin login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

export default router;