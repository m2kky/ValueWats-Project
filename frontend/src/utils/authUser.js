function decodeJwtPayload(token) {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;

    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const json = atob(padded);
    return JSON.parse(json);
  } catch (error) {
    return null;
  }
}

export function getStoredUser() {
  try {
    const stored = localStorage.getItem('user');
    const user = stored ? JSON.parse(stored) : {};
    const token = localStorage.getItem('token');

    if (!token) return user;

    const payload = decodeJwtPayload(token);
    if (!payload) return user;

    const mergedUser = {
      ...user,
      id: user.id || payload.userId,
      email: user.email || payload.email,
      role: user.role || payload.role,
      isSuperAdmin: user.isSuperAdmin ?? Boolean(payload.isSuperAdmin),
      tenantId: user.tenantId || payload.tenantId,
    };

    if (JSON.stringify(mergedUser) !== JSON.stringify(user)) {
      localStorage.setItem('user', JSON.stringify(mergedUser));
    }

    return mergedUser;
  } catch (error) {
    return {};
  }
}
