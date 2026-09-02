import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-charcoal flex flex-col items-center justify-center space-y-4">
        {/* Loading Spinner */}
        <div className="w-12 h-12 border-4 border-brand-lime border-t-transparent rounded-full animate-spin"></div>
        <p className="text-brand-lime font-mono text-sm tracking-wider">LOADING SECURE SESSION...</p>
      </div>
    );
  }

  if (!user) {
    // Redirect to login page and save the current location they tried to go to
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If user role is not allowed, redirect to their home space
    console.warn(`[ProtectedRoute] Unauthorized access attempt by ${user.role} to ${location.pathname}`);
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
    if (user.role === 'OWNER') return <Navigate to="/owner" replace />;
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
};
