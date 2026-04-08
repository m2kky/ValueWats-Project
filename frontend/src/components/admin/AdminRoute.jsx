import React from 'react';
import { Navigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import { getStoredUser } from '../../utils/authUser';

/**
 * Wrapper for all Super Admin routes to ensure access is restricted.
 */
function AdminRoute({ children }) {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = getStoredUser();
    if (!user || !user.email) {
      return <Navigate to="/login" replace />;
    }

    // Strict check for super admin
    if (user.isSuperAdmin !== true) {
      return <Navigate to="/dashboard" replace />;
    }
  } catch (error) {
    console.error('Failed to parse user data for AdminRoute', error);
    return <Navigate to="/login" replace />;
  }

  // Wraps matching routes in the dedicated Admin Layout
  return (
    <AdminLayout>
      {children}
    </AdminLayout>
  );
}

export default AdminRoute;
