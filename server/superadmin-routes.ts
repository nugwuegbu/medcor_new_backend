import express from 'express';
import jwt from 'jsonwebtoken';
import { db } from './db';
import { 
  tenants, 
  subscriptions, 
  users,
  insertTenantSchema,
  insertSubscriptionSchema,
  type InsertTenant,
  type InsertSubscription
} from '@shared/schema';
import { eq, desc, and, gte, lte, sql } from 'drizzle-orm';
import { z } from 'zod';

const router = express.Router();

// Middleware to verify MedCor super admin token
const verifySuperAdmin = async (req: any, res: any, next: any) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const jwtSecret = process.env.JWT_SECRET || 'medcor-admin-secret-dev-only';
    const decoded = jwt.verify(token, jwtSecret) as any;
    
    // Check if user is a MedCor super admin
    if (decoded.role !== 'superadmin') {
      return res.status(403).json({ error: 'Access denied. Super admin only.' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Get overall platform statistics
router.get('/superadmin/stats', verifySuperAdmin, async (req, res) => {
  try {
    // Get total tenants
    const totalTenants = await db.select({ count: sql<number>`count(*)` })
      .from(tenants)
      .then(result => result[0]?.count || 0);

    // Get active tenants (with active subscriptions)
    const activeTenants = await db.select({ count: sql<number>`count(DISTINCT ${tenants.id})` })
      .from(tenants)
      .leftJoin(subscriptions, eq(tenants.id, subscriptions.tenantId))
      .where(eq(subscriptions.status, 'active'))
      .then(result => result[0]?.count || 0);

    // Get total users across all tenants
    const totalUsers = await db.select({ count: sql<number>`count(*)` })
      .from(users)
      .then(result => result[0]?.count || 0);

    // Get monthly revenue (sum of active subscriptions)
    const monthlyRevenue = await db.select({ 
      total: sql<number>`sum(CASE 
        WHEN ${subscriptions.plan} = 'basic' THEN 299
        WHEN ${subscriptions.plan} = 'professional' THEN 799
        WHEN ${subscriptions.plan} = 'enterprise' THEN 1999
        ELSE 0
      END)` 
    })
      .from(subscriptions)
      .where(eq(subscriptions.status, 'active'))
      .then(result => result[0]?.total || 0);

    // Get active subscriptions count
    const activeSubscriptions = await db.select({ count: sql<number>`count(*)` })
      .from(subscriptions)
      .where(eq(subscriptions.status, 'active'))
      .then(result => result[0]?.count || 0);

    res.json({
      totalTenants,
      activeTenants,
      totalUsers,
      monthlyRevenue,
      revenueGrowth: 12.5, // Mock for now
      userGrowth: 8.3, // Mock for now
      activeSubscriptions,
      churnRate: 2.1, // Mock for now
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get all tenants with details
router.get('/superadmin/tenants', verifySuperAdmin, async (req, res) => {
  try {
    const { search, status } = req.query;

    const results = await db.select({
      tenant: tenants,
      subscription: subscriptions,
      userCount: sql<number>`(SELECT COUNT(*) FROM ${users} WHERE ${users.tenantId} = ${tenants.id})`,
    })
    .from(tenants)
    .leftJoin(subscriptions, eq(subscriptions.tenantId, tenants.id));

    // Transform results to match expected format
    const tenantsData = results.map(row => ({
      id: row.tenant.id,
      name: row.tenant.name,
      domain: row.tenant.domain,
      status: row.subscription?.status || 'inactive',
      subscription: row.subscription ? {
        plan: row.subscription.plan,
        status: row.subscription.status,
        expiresAt: row.subscription.endDate,
      } : null,
      userCount: row.userCount,
      revenue: row.subscription?.plan === 'basic' ? 299 : 
               row.subscription?.plan === 'professional' ? 799 : 
               row.subscription?.plan === 'enterprise' ? 1999 : 0,
      lastActive: row.tenant.updatedAt,
      createdAt: row.tenant.createdAt,
    }));

    res.json(tenantsData);
  } catch (error) {
    console.error('Tenants error:', error);
    res.status(500).json({ error: 'Failed to fetch tenants' });
  }
});

// Get single tenant details
router.get('/superadmin/tenants/:id', verifySuperAdmin, async (req, res) => {
  try {
    const tenantId = req.params.id;

    const [tenant] = await db.select()
      .from(tenants)
      .where(eq(tenants.id, parseInt(tenantId)));

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Get subscription
    const [subscription] = await db.select()
      .from(subscriptions)
      .where(eq(subscriptions.tenantId, parseInt(tenantId)));

    // Get user count and breakdown
    const userStats = await db.select({
      role: users.role,
      count: sql<number>`count(*)`,
    })
    .from(users)
    .where(eq(users.tenantId, parseInt(tenantId)))
    .groupBy(users.role);

    res.json({
      ...tenant,
      subscription,
      userStats,
    });
  } catch (error) {
    console.error('Tenant details error:', error);
    res.status(500).json({ error: 'Failed to fetch tenant details' });
  }
});

// Create new tenant
router.post('/superadmin/tenants', verifySuperAdmin, async (req, res) => {
  try {
    const tenantData = insertTenantSchema.parse(req.body);

    const [newTenant] = await db.insert(tenants)
      .values(tenantData)
      .returning();

    res.json(newTenant);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid tenant data', details: error.errors });
    }
    console.error('Create tenant error:', error);
    res.status(500).json({ error: 'Failed to create tenant' });
  }
});

// Update tenant
router.patch('/superadmin/tenants/:id', verifySuperAdmin, async (req, res) => {
  try {
    const tenantId = req.params.id;
    const updates = req.body;

    const [updatedTenant] = await db.update(tenants)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, parseInt(tenantId)))
      .returning();

    if (!updatedTenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    res.json(updatedTenant);
  } catch (error) {
    console.error('Update tenant error:', error);
    res.status(500).json({ error: 'Failed to update tenant' });
  }
});

// Get subscriptions
router.get('/superadmin/subscriptions', verifySuperAdmin, async (req, res) => {
  try {
    const subs = await db.select({
      subscription: subscriptions,
      tenant: tenants,
    })
    .from(subscriptions)
    .leftJoin(tenants, eq(subscriptions.tenantId, tenants.id))
    .orderBy(desc(subscriptions.createdAt));

    res.json(subs);
  } catch (error) {
    console.error('Subscriptions error:', error);
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

// Create/Update subscription
router.post('/superadmin/subscriptions', verifySuperAdmin, async (req, res) => {
  try {
    const subscriptionData = insertSubscriptionSchema.parse(req.body);

    const [newSubscription] = await db.insert(subscriptions)
      .values(subscriptionData)
      .onConflictDoUpdate({
        target: subscriptions.tenantId,
        set: {
          ...subscriptionData,
          updatedAt: new Date(),
        },
      })
      .returning();

    res.json(newSubscription);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid subscription data', details: error.errors });
    }
    console.error('Create subscription error:', error);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
});

// Update subscription status
router.patch('/superadmin/subscriptions/:id', verifySuperAdmin, async (req, res) => {
  try {
    const subscriptionId = req.params.id;
    const { status } = req.body;

    const [updatedSubscription] = await db.update(subscriptions)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, parseInt(subscriptionId)))
      .returning();

    if (!updatedSubscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    res.json(updatedSubscription);
  } catch (error) {
    console.error('Update subscription error:', error);
    res.status(500).json({ error: 'Failed to update subscription' });
  }
});

// Get revenue analytics
router.get('/superadmin/analytics/revenue', verifySuperAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Mock revenue data for now
    const revenueData = {
      totalRevenue: 38192,
      monthlyRecurring: 35000,
      growth: 12.5,
      byPlan: {
        basic: { count: 15, revenue: 4485 },
        professional: { count: 20, revenue: 15980 },
        enterprise: { count: 7, revenue: 13993 },
      },
      monthlyTrend: [
        { month: 'Jan', revenue: 28000 },
        { month: 'Feb', revenue: 30000 },
        { month: 'Mar', revenue: 32000 },
        { month: 'Apr', revenue: 35000 },
        { month: 'May', revenue: 38192 },
      ],
    };

    res.json(revenueData);
  } catch (error) {
    console.error('Revenue analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch revenue analytics' });
  }
});

// Get user analytics
router.get('/superadmin/analytics/users', verifySuperAdmin, async (req, res) => {
  try {
    // Get user distribution by role
    const usersByRole = await db.select({
      role: users.role,
      count: sql<number>`count(*)`,
    })
    .from(users)
    .groupBy(users.role);

    // Get user growth trend (mock for now)
    const userGrowth = {
      total: 15420,
      growth: 8.3,
      byRole: usersByRole,
      monthlyTrend: [
        { month: 'Jan', users: 12000 },
        { month: 'Feb', users: 13000 },
        { month: 'Mar', users: 14000 },
        { month: 'Apr', users: 15000 },
        { month: 'May', users: 15420 },
      ],
      activeUsers: 13200,
      engagementRate: 85.6,
    };

    res.json(userGrowth);
  } catch (error) {
    console.error('User analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch user analytics' });
  }
});

export default router;