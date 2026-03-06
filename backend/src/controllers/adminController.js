const prisma = require('../config/database');
const jwt = require('jsonwebtoken');

// ==========================================
// 1. Dashboard Overview
// ==========================================
exports.getSystemStats = async (req, res) => {
  try {
    const totalTenants = await prisma.tenant.count();
    const activeInstances = await prisma.instance.count({ where: { status: 'connected' } });
    
    // Total messages sent today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const messagesToday = await prisma.message.count({
      where: {
        createdAt: { gte: today },
        status: { in: ['sent', 'delivered'] }
      }
    });

    const totalUsers = await prisma.user.count();

    res.json({
      totalTenants,
      activeInstances,
      messagesToday,
      totalUsers,
      bullMqStatus: 'Operational', // Mocked, ideally from BullMQ queue getters
      redisStatus: 'Operational'
    });
  } catch (error) {
    console.error('getSystemStats error', error);
    res.status(500).json({ error: 'Failed to fetch system stats' });
  }
};

// ==========================================
// 2. Tenants Management
// ==========================================
exports.getTenants = async (req, res) => {
  try {
    const tenants = await prisma.tenant.findMany({
      include: {
        _count: {
          select: { users: true, instances: true }
        },
        plan: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(tenants);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tenants' });
  }
};

exports.getTenantDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        users: {
            select: { id: true, email: true, role: true, name: true, createdAt: true }
        },
        instances: true,
        plan: true,
        billing: { orderBy: { periodStart: 'desc' }, take: 5 }
      }
    });
    
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
    res.json(tenant);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tenant details' });
  }
};

exports.updateTenantStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'active', 'suspended', 'trial'

    const tenant = await prisma.tenant.update({
      where: { id },
      data: { status }
    });
    res.json(tenant);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update tenant status' });
  }
};

// Impersonation: Generate a token for a specific tenant as an admin
exports.impersonateTenant = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find an admin user in that tenant
    const targetUser = await prisma.user.findFirst({
      where: { tenantId: id, role: 'admin' }
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'No admin user found in target tenant to impersonate' });
    }

    // Generate JWT pretending to be this user, but flag it as impersonated
    const token = jwt.sign(
      {
        userId: targetUser.id,
        email: targetUser.email,
        role: targetUser.role,
        isSuperAdmin: true, // They keep their super admin powers
        tenantId: targetUser.tenantId,
        impersonatedBy: req.adminUser.email // Audit trail in token
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' } // Short lived token for security
    );

    res.json({ token, message: `Impersonating tenant via user ${targetUser.email}` });
  } catch (error) {
    console.error('impersonate error:', error);
    res.status(500).json({ error: 'Failed to impersonate tenant' });
  }
};

// ==========================================
// 3. Plans Management 
// ==========================================
exports.getPlans = async (req, res) => {
  try {
    const plans = await prisma.plan.findMany({ orderBy: { price: 'asc' } });
    res.json(plans);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
};

exports.createPlan = async (req, res) => {
  try {
    const plan = await prisma.plan.create({ data: req.body });
    res.status(201).json(plan);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create plan' });
  }
};

exports.updatePlan = async (req, res) => {
  try {
    const plan = await prisma.plan.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(plan);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update plan' });
  }
};

// ==========================================
// 4. Users Management
// ==========================================
exports.getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: { tenant: { select: { name: true, status: true } } },
      orderBy: { createdAt: 'desc' }
    });
    // Don't send password hashes
    const sanitized = users.map(u => {
        const { passwordHash, ...safe } = u;
        return safe;
    });
    res.json(sanitized);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

exports.resetUserPassword = async (req, res) => {
  // In a real scenario, this would trigger a password reset email
  // or return a temporary password generated securely.
  try {
    res.status(200).json({ message: 'Password reset link sent to user email (Mocked)' });
  } catch(e) {
    res.status(500).json({ error: 'Failed' });
  }
};
