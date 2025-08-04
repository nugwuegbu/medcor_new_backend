import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Mock middleware to verify MedCor admin token
const verifyMedCorAdmin = async (req: any, res: any, next: any) => {
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

// Get admin statistics (mock data)
router.get('/admin/stats', verifyMedCorAdmin, async (req, res) => {
  const stats = {
    totalTenants: 48,
    activeTenants: 42,
    totalUsers: 15420,
    monthlyRevenue: 38192,
    revenueGrowth: 12.5,
    userGrowth: 8.3,
    activeSubscriptions: 42,
    churnRate: 2.1,
  };

  res.json(stats);
});

// Get all tenants with summary (mock data)
router.get('/admin/tenants', verifyMedCorAdmin, async (req, res) => {
  const { search, status } = req.query;

  const mockTenants = [
    {
      id: '1',
      name: 'City General Hospital',
      domain: 'citygeneral.medcor.ai',
      status: 'active',
      subscription: {
        plan: 'professional',
        status: 'active',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      userCount: 245,
      revenue: 799,
      lastActive: new Date().toISOString(),
    },
    {
      id: '2',
      name: 'Memorial Medical Center',
      domain: 'memorial.medcor.ai',
      status: 'active',
      subscription: {
        plan: 'enterprise',
        status: 'active',
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      },
      userCount: 580,
      revenue: 1499,
      lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '3',
      name: 'Westside Clinic',
      domain: 'westside.medcor.ai',
      status: 'active',
      subscription: {
        plan: 'basic',
        status: 'active',
        expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      },
      userCount: 45,
      revenue: 299,
      lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '4',
      name: 'Healthcare Plus',
      domain: 'healthcareplus.medcor.ai',
      status: 'inactive',
      subscription: {
        plan: 'professional',
        status: 'cancelled',
        expiresAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      userCount: 120,
      revenue: 0,
      lastActive: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  // Apply filters
  let filteredTenants = mockTenants;
  
  if (search) {
    filteredTenants = filteredTenants.filter(tenant => 
      tenant.name.toLowerCase().includes(search.toString().toLowerCase()) ||
      tenant.domain.toLowerCase().includes(search.toString().toLowerCase())
    );
  }
  
  if (status && status !== 'all') {
    filteredTenants = filteredTenants.filter(tenant => tenant.status === status);
  }

  res.json(filteredTenants);
});

// Export admin report (mock CSV)
router.post('/admin/export', verifyMedCorAdmin, async (req, res) => {
  const csvContent = `Tenant Name,Domain,Status,Users,Revenue,Last Active
City General Hospital,citygeneral.medcor.ai,active,245,799,${new Date().toISOString()}
Memorial Medical Center,memorial.medcor.ai,active,580,1499,${new Date().toISOString()}
Westside Clinic,westside.medcor.ai,active,45,299,${new Date().toISOString()}
Healthcare Plus,healthcareplus.medcor.ai,inactive,120,0,${new Date().toISOString()}`;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="medcor-report-${new Date().toISOString().split('T')[0]}.csv"`);
  res.send(csvContent);
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
    const validPassword = password === 'MedCor@2025!';

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create a super admin token
    const jwtSecret = process.env.JWT_SECRET || 'medcor-admin-secret-dev-only';
    const token = jwt.sign(
      { 
        userId: 'superadmin',
        email: 'superadmin@medcor.ai',
        role: 'superadmin'
      },
      jwtSecret,
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