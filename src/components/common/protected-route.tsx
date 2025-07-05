import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactElement;
  roles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles }) => {
  const location = useLocation();
  const authToken = localStorage.getItem('authToken');
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  if (!authToken) {
    return <Navigate to="/" replace state={{ from: location, unauthorized: true }} />;
  }

  // Check for role-based access if roles are specified
  if (roles?.length && user?.role) {
    const hasRequiredRole = roles.includes(user.role);
    if (!hasRequiredRole) {
      return <Navigate to="/unauthorized" replace state={{ from: location }} />;
    }
  }

  return children;
};

export default ProtectedRoute;