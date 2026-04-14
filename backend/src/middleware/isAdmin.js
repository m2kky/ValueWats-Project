const jwt = require('jsonwebtoken');
const prisma = require('../config/database');

/**
 * Middleware to ensure the authenticated user is a SUPER_ADMIN.
 * Used for all /api/admin/* routes.
 */
const isAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
      }
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Must have isSuperAdmin flag in token
    if (!decoded.isSuperAdmin) {
      return res.status(403).json({ error: 'Forbidden: Super Admin access required' });
    }

    // Double check with Database for ultimate security just in case a token was compromised
    // or their admin status was revoked while token is still active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { isSuperAdmin: true, role: true }
    });

    if (!user || !['admin', 'owner'].includes(user.role) || !user.isSuperAdmin) {
      return res.status(403).json({ error: 'Forbidden: Super Admin access required' });
    }

    // Attach user to request
    req.adminUser = {
      id: decoded.userId,
      email: decoded.email,
    };

    next();
  } catch (error) {
    console.error('Admin Authorization Error:', error);
    return res.status(500).json({ error: 'Admin authorization failed' });
  }
};

module.exports = isAdmin;
