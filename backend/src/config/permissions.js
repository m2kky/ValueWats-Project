const ROLE_PERMISSIONS = {
  owner: [
    'team.manage', 'billing.manage', 'channels.manage', 'integrations.manage',
    'settings.manage', 'campaigns.manage', 'templates.manage', 'contacts.manage',
    'inbox.manage', 'reports.view', 'agents.manage', 'automations.manage',
    'inbox.view', 'contacts.view', 'dashboard.view'
  ],
  admin: [
    'team.manage', 'billing.manage', 'channels.manage', 'integrations.manage',
    'settings.manage', 'campaigns.manage', 'templates.manage', 'contacts.manage',
    'inbox.manage', 'reports.view', 'agents.manage', 'automations.manage',
    'inbox.view', 'contacts.view', 'dashboard.view'
  ],
  supervisor: [
    'campaigns.manage', 'templates.manage', 'contacts.manage',
    'inbox.manage', 'reports.view',
    'inbox.view', 'contacts.view', 'dashboard.view'
  ],
  agent: [
    'inbox.manage',
    'inbox.view', 'contacts.view', 'dashboard.view'
  ],
  viewer: [
    'inbox.view', 'contacts.view', 'dashboard.view'
  ]
};

const ALL_ROLES = ['owner', 'admin', 'supervisor', 'agent', 'viewer'];
const PAID_SEAT_ROLES = ['owner', 'admin', 'supervisor', 'agent'];
const INVITABLE_ROLES = ['admin', 'supervisor', 'agent', 'viewer'];

function hasPermission(role, permission) {
  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return false;
  return perms.includes(permission);
}

module.exports = { ROLE_PERMISSIONS, ALL_ROLES, PAID_SEAT_ROLES, INVITABLE_ROLES, hasPermission };
