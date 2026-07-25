const jwt = require('jsonwebtoken');
const prisma = require('../config/database');

/**
 * Middleware to extract tenant context from JWT token
 * Ensures all database queries are scoped to the authenticated tenant
 */
const tenantContext = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.tenantId = decoded.tenantId;

    // Verify tenant exists and is active
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.tenantId },
    });

    if (!tenant) {
      return res.status(403).json({ error: 'Tenant not found' });
    }

    if (tenant.status !== 'active' && tenant.status !== 'trial') {
      return res.status(403).json({ error: 'Tenant account is not active' });
    }

    const user = await prisma.user.findFirst({
      where: {
        id: decoded.userId,
        tenantId: req.tenantId,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        role: true,
        tenantId: true,
        isSuperAdmin: true,
      },
    });

    if (!user) {
      return res.status(403).json({ error: 'User is inactive', code: 'USER_INACTIVE' });
    }

    req.user = {
      id: user.id,
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      isSuperAdmin: user.isSuperAdmin,
    };
    req.tenantId = user.tenantId;

    // Run the rest of the request within the tenant's AsyncLocalStorage context
    // This allows Prisma Extension to automatically scope all queries to this tenant
    prisma.tenantStorage.run(req.tenantId, () => {
      next();
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

module.exports = tenantContext;
