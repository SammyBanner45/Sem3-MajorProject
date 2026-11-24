import React from 'react';
import { Navigate } from 'react-router-dom';

// Keep the old /auth entry point working while the dedicated routes are used.
export default function AuthRedirect() {
  return <Navigate to="/login" replace />;
}
