const prisma = require('../config/database');
const jwt = require('jsonwebtoken');

const VALID_TENANT_STATUSES = new Set(['active', 'suspended', 'trial']);
const VALID_NOTIFICATION_TYPES = new Set(['info', 'warning', 'error', 'success']);
const DEFAULT_WORKING_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toInt(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toDecimal(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizePlanPayload(input, { requireName = false } = {}) {
  const payload = {};

  if (requireName) {
    if (!input.name || typeof input.name !== 'string') {
      return { error: 'Plan name is required' };
    }
    payload.name = input.name.trim().toLowerCase();
    if (!payload.name) return { error: 'Plan name is required' };
  } else if (typeof input.name === 'string') {
    payload.name = input.name.trim().toLowerCase();
    if (!payload.name) return { error: 'Plan name cannot be empty' };
  }

  if (input.maxMessagesPerDay !== undefined) {
    payload.maxMessagesPerDay = toInt(input.maxMessagesPerDay, NaN);
    if (!Number.isFinite(payload.maxMessagesPerDay) || payload.maxMessagesPerDay < 1) {
      return { error: 'maxMessagesPerDay must be a positive number' };
    }
  }

  if (input.maxContactsPerCampaign !== undefined) {
    payload.maxContactsPerCampaign = toInt(input.maxContactsPerCampaign, NaN);
    if (!Number.isFinite(payload.maxContactsPerCampaign) || payload.maxContactsPerCampaign < 1) {
      return { error: 'maxContactsPerCampaign must be a positive number' };
    }
  }

  if (input.maxInstances !== undefined) {
    payload.maxInstances = toInt(input.maxInstances, NaN);
    if (!Number.isFinite(payload.maxInstances) || payload.maxInstances < 1) {
      return { error: 'maxInstances must be a positive number' };
    }
  }

  if (input.price !== undefined) {
    payload.price = toDecimal(input.price, NaN);
    if (!Number.isFinite(payload.price) || payload.price < 0) {
      return { error: 'price must be zero or a positive number' };
    }
  }

  if (input.workingHoursEnabled !== undefined) {
    payload.workingHoursEnabled = Boolean(input.workingHoursEnabled);
  }

  if (input.workingHoursStart !== undefined) {
    payload.workingHoursStart = String(input.workingHoursStart).trim();
  }

  if (input.workingHoursEnd !== undefined) {
    payload.workingHoursEnd = String(input.workingHoursEnd).trim();
  }

  if (input.workingDays !== undefined) {
    if (!Array.isArray(input.workingDays)) {
      return { error: 'workingDays must be an array' };
    }
    payload.workingDays = input.workingDays.map((d) => String(d).trim()).filter(Boolean);
    if (payload.workingDays.length === 0) payload.workingDays = DEFAULT_WORKING_DAYS;
  }

  return { payload };
}

function normalizeNotificationPayload(input, { requireTitleAndMessage = false } = {}) {
  const payload = {};

  if (requireTitleAndMessage) {
    if (!input.title || !String(input.title).trim()) return { error: 'Notification title is required' };
    if (!input.message || !String(input.message).trim()) return { error: 'Notification message is required' };
  }

  if (input.title !== undefined) {
    payload.title = String(input.title).trim();
    if (!payload.title) return { error: 'Notification title cannot be empty' };
  }

  if (input.message !== undefined) {
    payload.message = String(input.message).trim();
    if (!payload.message) return { error: 'Notification message cannot be empty' };
  }

  if (input.type !== undefined) {
    const normalizedType = String(input.type).trim().toLowerCase();
    if (!VALID_NOTIFICATION_TYPES.has(normalizedType)) {
      return { error: 'Notification type must be one of: info, warning, error, success' };
    }
    payload.type = normalizedType;
  }

  if (input.isActive !== undefined) {
    payload.isActive = Boolean(input.isActive);
  }

  if (input.expiresAt !== undefined) {
    if (input.expiresAt === null || input.expiresAt === '') {
      payload.expiresAt = null;
    } else {
      const parsed = new Date(input.expiresAt);
      if (Number.isNaN(parsed.getTime())) {
        return { error: 'expiresAt must be a valid date or null' };
      }
      payload.expiresAt = parsed;
    }
  }

  return { payload };
}

// ==========================================
// 1. Dashboard Overview
// ==========================================
exports.getSystemStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalTenants,
      activeInstances,
      messagesToday,
      totalUsers,
      activeNotifications,
      tenants
    ] = await Promise.all([
      prisma.tenant.count(),
      prisma.instance.count({ where: { status: 'connected' } }),
      prisma.message.count({
        where: {
          createdAt: { gte: today },
          status: { in: ['SENT', 'DELIVERED', 'READ', 'sent', 'delivered', 'read'] }
        }
      }),
      prisma.user.count(),
      prisma.globalNotification.count({
        where: {
          isActive: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
        }
      }),
      prisma.tenant.findMany({
        select: {
          subscriptionPlan: true,
          status: true,
          plan: { select: { name: true } }
        }
      })
    ]);

    const tenantsByStatus = { active: 0, trial: 0, suspended: 0 };
    const planDistribution = {};

    for (const tenant of tenants) {
      if (tenantsByStatus[tenant.status] !== undefined) {
        tenantsByStatus[tenant.status] += 1;
      }

      const planName = tenant.plan?.name || tenant.subscriptionPlan || 'unassigned';
      planDistribution[planName] = (planDistribution[planName] || 0) + 1;
    }

    res.json({
      totalTenants,
      activeInstances,
      messagesToday,
      totalUsers,
      activeNotifications,
      tenantsByStatus,
      planDistribution,
      bullMqStatus: 'Operational',
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
    const { status } = req.body;

    if (!VALID_TENANT_STATUSES.has(status)) {
      return res.status(400).json({ error: 'Status must be one of: active, suspended, trial' });
    }

    const tenant = await prisma.tenant.update({
      where: { id },
      data: { status }
    });
    res.json(tenant);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update tenant status' });
  }
};

exports.updateTenantPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { planId, planName } = req.body;

    if ((planId === '' || planId === null) && !planName) {
      const tenant = await prisma.tenant.update({
        where: { id },
        data: {
          planId: null,
          subscriptionPlan: null
        },
        include: { plan: true }
      });

      return res.json(tenant);
    }

    let plan = null;
    if (planId) {
      plan = await prisma.plan.findUnique({ where: { id: String(planId) } });
    } else if (planName) {
      plan = await prisma.plan.findUnique({ where: { name: String(planName).trim().toLowerCase() } });
    }

    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    const tenant = await prisma.tenant.update({
      where: { id },
      data: {
        planId: plan.id,
        subscriptionPlan: plan.name
      },
      include: { plan: true }
    });

    res.json(tenant);
  } catch (error) {
    console.error('updateTenantPlan error', error);
    res.status(500).json({ error: 'Failed to update tenant plan' });
  }
};

// Impersonation: Generate a token for a specific tenant as an admin
exports.impersonateTenant = async (req, res) => {
  try {
    const { id } = req.params;

    const targetUser = await prisma.user.findFirst({
      where: { tenantId: id, role: 'admin' },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            subscriptionPlan: true,
            onboardingCompleted: true
          }
        }
      }
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'No admin user found in target tenant to impersonate' });
    }

    const token = jwt.sign(
      {
        userId: targetUser.id,
        email: targetUser.email,
        role: targetUser.role,
        isSuperAdmin: true,
        tenantId: targetUser.tenantId,
        impersonatedBy: req.adminUser.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      token,
      message: `Impersonating tenant via user ${targetUser.email}`,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        role: targetUser.role,
        isSuperAdmin: true,
        tenantId: targetUser.tenantId,
        onboardingCompleted: targetUser.tenant?.onboardingCompleted
      },
      tenant: targetUser.tenant
    });
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
    const { payload, error } = normalizePlanPayload(req.body, { requireName: true });
    if (error) return res.status(400).json({ error });

    const plan = await prisma.plan.create({ data: payload });
    res.status(201).json(plan);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'A plan with this name already exists' });
    }
    res.status(500).json({ error: 'Failed to create plan' });
  }
};

exports.updatePlan = async (req, res) => {
  try {
    const { payload, error } = normalizePlanPayload(req.body);
    if (error) return res.status(400).json({ error });
    if (Object.keys(payload).length === 0) {
      return res.status(400).json({ error: 'No valid fields were provided for update' });
    }

    const plan = await prisma.plan.update({
      where: { id: req.params.id },
      data: payload
    });

    if (payload.name) {
      await prisma.tenant.updateMany({
        where: { planId: plan.id },
        data: { subscriptionPlan: plan.name }
      });
    }

    res.json(plan);
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Plan not found' });
    if (error.code === 'P2002') return res.status(409).json({ error: 'A plan with this name already exists' });
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

    const sanitized = users.map((u) => {
      const { passwordHash, ...safe } = u;
      return safe;
    });

    res.json(sanitized);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

exports.resetUserPassword = async (req, res) => {
  try {
    res.status(200).json({ message: 'Password reset link sent to user email (Mocked)' });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
};

// ==========================================
// 5. Global Notifications (Super Admin)
// ==========================================
exports.getGlobalNotifications = async (req, res) => {
  try {
    const notifications = await prisma.globalNotification.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(notifications);
  } catch (error) {
    console.error('getGlobalNotifications error', error);
    res.status(500).json({ error: 'Failed to fetch global notifications' });
  }
};

exports.createGlobalNotification = async (req, res) => {
  try {
    const { payload, error } = normalizeNotificationPayload(req.body, { requireTitleAndMessage: true });
    if (error) return res.status(400).json({ error });

    const notification = await prisma.globalNotification.create({ data: payload });
    res.status(201).json(notification);
  } catch (error) {
    console.error('createGlobalNotification error', error);
    res.status(500).json({ error: 'Failed to create global notification' });
  }
};

exports.updateGlobalNotification = async (req, res) => {
  try {
    const { payload, error } = normalizeNotificationPayload(req.body);
    if (error) return res.status(400).json({ error });
    if (Object.keys(payload).length === 0) {
      return res.status(400).json({ error: 'No valid fields were provided for update' });
    }

    const notification = await prisma.globalNotification.update({
      where: { id: req.params.id },
      data: payload
    });

    res.json(notification);
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Notification not found' });
    console.error('updateGlobalNotification error', error);
    res.status(500).json({ error: 'Failed to update global notification' });
  }
};

exports.toggleGlobalNotification = async (req, res) => {
  try {
    const existing = await prisma.globalNotification.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Notification not found' });

    const updated = await prisma.globalNotification.update({
      where: { id: req.params.id },
      data: { isActive: !existing.isActive }
    });

    res.json(updated);
  } catch (error) {
    console.error('toggleGlobalNotification error', error);
    res.status(500).json({ error: 'Failed to toggle global notification' });
  }
};

exports.deleteGlobalNotification = async (req, res) => {
  try {
    await prisma.globalNotification.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Notification not found' });
    console.error('deleteGlobalNotification error', error);
    res.status(500).json({ error: 'Failed to delete global notification' });
  }
};

// ==========================================
// 6. Active Notifications (Tenant users)
// ==========================================
exports.getActiveGlobalNotifications = async (req, res) => {
  try {
    const notifications = await prisma.globalNotification.findMany({
      where: {
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(notifications);
  } catch (error) {
    console.error('getActiveGlobalNotifications error', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};
