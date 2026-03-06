import React from 'react';
import { Navigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';

/**
 * Wrapper for all Super Admin routes to ensure access is restricted.
 */
function AdminRoute({ children }) {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  try {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      
      // Strict check for super admin
      if (user.isSuperAdmin !== true) {
        return <Navigate to="/dashboard" replace />;
      }
    } else {
      return <Navigate to="/login" replace />;
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
