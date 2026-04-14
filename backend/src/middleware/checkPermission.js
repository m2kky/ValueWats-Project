const { hasPermission } = require('../config/permissions');

function checkPermission(permission) {
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!hasPermission(role, permission)) {
      return res.status(403).json({
        error: 'Forbidden: You do not have permission to perform this action',
        required: permission,
        yourRole: role
      });
    }
    next();
  };
}

module.exports = checkPermission;
