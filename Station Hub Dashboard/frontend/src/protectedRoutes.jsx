
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, token } = useAuth();
  const location = useLocation();

  // 1. Is the user authenticated?
  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Does the user have the required role level?
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  // 3. Authorization verified successfully
  return children;
};
