import { getStoredUser } from '../utils/authUser';

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

const NAV_PERMISSIONS = {
  '/dashboard': 'dashboard.view',
  '/inbox': 'inbox.view',
  '/contacts': 'contacts.view',
  '/campaigns': 'campaigns.manage',
  '/templates': 'templates.manage',
  '/agents': 'agents.manage',
  '/channels': 'channels.manage',
  '/automations': 'automations.manage',
  '/workflows': 'automations.manage',
  '/settings': 'settings.manage',
  '/help': null,
};

export function usePermission(permission) {
  const user = getStoredUser();
  const role = user?.role || 'viewer';
  const perms = ROLE_PERMISSIONS[role] || [];
  return perms.includes(permission);
}

export function useNavFilter() {
  const user = getStoredUser();
  const role = user?.role || 'viewer';
  const perms = ROLE_PERMISSIONS[role] || [];
  return (navItem) => {
    const requiredPerm = NAV_PERMISSIONS[navItem.path];
    if (requiredPerm === null || requiredPerm === undefined) return true;
    return perms.includes(requiredPerm);
  };
}
