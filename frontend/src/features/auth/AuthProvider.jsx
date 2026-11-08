import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { apiFetch } from '../../lib/api.js';

const TOKEN_KEY = 'ecosync_token';
const LEGACY_TOKEN_KEYS = ['token', 'authToken'];
const AuthContext = createContext(null);

function clearStoredAuth() {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  LEGACY_TOKEN_KEYS.forEach((key) => localStorage.removeItem(key));
}

function clearLegacyStoredTokens() {
  if (typeof localStorage === 'undefined') return;
  LEGACY_TOKEN_KEYS.forEach((key) => localStorage.removeItem(key));
}

function readTokenPayload(token) {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

function makeUser(authResult) {
  const { user, profile, token } = authResult || {};
  if (typeof token !== 'string' || !token || !user || typeof user.id !== 'string' || !['USER', 'ADMIN'].includes(user.role) ||
      !profile || typeof profile.displayName !== 'string') {
    throw new Error('The server returned an invalid authentication response.');
  }
  return {
    id: user.id,
    email: typeof user.email === 'string' ? user.email : undefined,
    role: user.role,
    displayName: profile.displayName,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const initializationStarted = useRef(false);

  const logout = useCallback(() => {
    clearStoredAuth();
    setUser(null);
    setToken(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const storedToken = typeof localStorage === 'undefined' ? null : localStorage.getItem(TOKEN_KEY);
    if (!storedToken) {
      logout();
      return null;
    }

    const payload = readTokenPayload(storedToken);
    if (!payload || typeof payload.sub !== 'string' || !['USER', 'ADMIN'].includes(payload.role)) {
      logout();
      return null;
    }

    try {
      // The API response, rather than the token's mere presence, validates the session.
      const result = await apiFetch('/api/profile/me', { token: storedToken });
      const profile = result?.profile;
      if (!profile || profile.id !== payload.sub || typeof profile.displayName !== 'string') {
        logout();
        return null;
      }
      if (localStorage.getItem(TOKEN_KEY) !== storedToken) return null;
      const restoredUser = { id: profile.id, role: payload.role, displayName: profile.displayName };
      setToken(storedToken);
      setUser(restoredUser);
      return restoredUser;
    } catch (error) {
      if (error.status !== 401) {
        // Do not accept or discard a cached token when the server cannot validate it.
        throw error;
      }
      logout();
      return null;
    }
  }, [logout]);

  const login = useCallback((authResult) => {
    const nextUser = makeUser(authResult);
    clearStoredAuth();
    localStorage.setItem(TOKEN_KEY, authResult.token);
    setToken(authResult.token);
    setUser(nextUser);
    return nextUser;
  }, []);

  const updateUser = useCallback((updates) => {
    setUser((current) => current ? { ...current, ...updates } : current);
  }, []);

  useEffect(() => {
    clearLegacyStoredTokens();
    const handleUnauthorized = () => logout();
    window.addEventListener('ecosync:unauthorized', handleUnauthorized);

    if (!initializationStarted.current) {
      initializationStarted.current = true;
      refreshUser()
        .catch(() => {
          // A network outage does not prove the stored token is invalid.
        })
        .finally(() => setLoading(false));
    }

    return () => window.removeEventListener('ecosync:unauthorized', handleUnauthorized);
  }, [logout, refreshUser]);

  const value = useMemo(() => ({ user, token, loading, login, logout, refreshUser, updateUser }), [
    user, token, loading, login, logout, refreshUser, updateUser,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
