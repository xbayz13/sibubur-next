'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, LoginRequest } from '@/types';
import { authService } from '@/lib/auth';
import { permissionsService } from '@/lib/services/permissions-service';

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

  const loadPermissions = useCallback(async () => {
    if (!authService.isAuthenticated()) {
      setPermissions([]);
      setIsSuperAdmin(false);
      return;
    }

    try {
      const isAdmin = await permissionsService.isSuperAdmin();
      setIsSuperAdmin(isAdmin);

      if (isAdmin) {
        setPermissions(['superadmin:*']);
      } else {
        const userPermissions = await permissionsService.getUserPermissions();
        setPermissions(userPermissions);
      }
    } catch (error) {
      console.error('Failed to load permissions:', error);
      setPermissions([]);
      setIsSuperAdmin(false);
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
  };

  const hasPermission = (permission: string): boolean => {
    if (isSuperAdmin) {
      return true;
    }
    return permissions.includes(permission);
  };

  const refreshPermissions = useCallback(async () => {
    await loadPermissions();
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

