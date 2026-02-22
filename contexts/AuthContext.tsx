'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { User, LoginRequest } from '@/types';
import { authService } from '@/lib/auth';
import { permissionsService } from '@/lib/services/permissions-service';

const PERMISSIONS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface PermissionCache {
  permissions: string[];
  isSuperAdmin: boolean;
  timestamp: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  permissions: string[];
  hasPermission: (permission: string) => boolean;
  isSuperAdmin: boolean;
  refreshPermissions: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const permissionsCacheRef = useRef<PermissionCache | null>(null);

  const loadPermissions = useCallback(async (forceRefresh = false) => {
    if (!authService.isAuthenticated()) {
      setPermissions([]);
      setIsSuperAdmin(false);
      permissionsCacheRef.current = null;
      return;
    }

    const now = Date.now();
    const cached = permissionsCacheRef.current;
    if (!forceRefresh && cached && now - cached.timestamp < PERMISSIONS_CACHE_TTL) {
      setPermissions(cached.permissions);
      setIsSuperAdmin(cached.isSuperAdmin);
      return;
    }

    try {
      const isAdmin = await permissionsService.isSuperAdmin();
      setIsSuperAdmin(isAdmin);

      if (isAdmin) {
        const perms = ['superadmin:*'];
        setPermissions(perms);
        permissionsCacheRef.current = { permissions: perms, isSuperAdmin: true, timestamp: now };
      } else {
        const userPermissions = await permissionsService.getUserPermissions();
        setPermissions(userPermissions);
        permissionsCacheRef.current = { permissions: userPermissions, isSuperAdmin: false, timestamp: now };
      }
    } catch (error) {
      console.error('Failed to load permissions:', error);
      setPermissions([]);
      setIsSuperAdmin(false);
      permissionsCacheRef.current = null;
    }
  }, []);

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = authService.getUser();
    if (storedUser && authService.isAuthenticated()) {
      setUser(storedUser);
      loadPermissions();
    }
    setLoading(false);
  }, [loadPermissions]);

  const login = async (credentials: LoginRequest) => {
    const response = await authService.login(credentials);
    setUser(response.user);
    await loadPermissions();
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setPermissions([]);
    setIsSuperAdmin(false);
    permissionsCacheRef.current = null;
  };

  const hasPermission = (permission: string): boolean => {
    // SuperAdmin and Owner have all permissions
    if (isSuperAdmin || user?.role?.name === 'Owner') {
      return true;
    }
    return permissions.includes(permission);
  };

  const refreshPermissions = useCallback(async () => {
    await loadPermissions(true);
  }, [loadPermissions]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
        permissions,
        hasPermission,
        isSuperAdmin,
        refreshPermissions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

