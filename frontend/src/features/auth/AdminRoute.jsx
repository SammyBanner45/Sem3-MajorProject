import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthProvider.jsx';

export default function AdminRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-6 text-center text-sm text-gray-500" role="status">Checking access…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'ADMIN') return <Navigate to="/" replace />;
  return <Outlet />;
}
