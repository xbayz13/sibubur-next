'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ToastContainer';
import { getPermissionsForRoute, hasAnyPermission } from '@/lib/permissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string | string[];
}

export default function ProtectedRoute({ children, requiredPermission }: ProtectedRouteProps) {
  const { isAuthenticated, loading, hasPermission, permissions, isSuperAdmin, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { showToast } = useToast();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      showToast('Anda harus login terlebih dahulu', 'error');
      router.push('/login');
      return;
    }

    // Check permissions if user is authenticated
    if (!loading && isAuthenticated) {
      // SuperAdmin and Owner have access to everything
      if (isSuperAdmin || user?.role?.name === 'Owner') {
        return;
      }

      // Get required permissions for this route
      let requiredPermissions: string[] = [];
      
      if (requiredPermission) {
        requiredPermissions = Array.isArray(requiredPermission) 
          ? requiredPermission 
          : [requiredPermission];
      } else {
        // Auto-detect permissions from route
        requiredPermissions = getPermissionsForRoute(pathname);
      }

      // If no permissions required, allow access
      if (requiredPermissions.length === 0) {
        return;
      }

      // Check if user has any of the required permissions
      if (!hasAnyPermission(permissions, requiredPermissions)) {
        showToast('Anda tidak memiliki akses ke halaman ini', 'error');
        router.push('/');
        return;
      }
    }
  }, [loading, isAuthenticated, pathname, requiredPermission, hasPermission, permissions, isSuperAdmin, user, router, showToast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Check permissions before rendering
  if (isSuperAdmin || user?.role?.name === 'Owner') {
    return <>{children}</>;
  }

  const requiredPermissions = requiredPermission
    ? (Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission])
    : getPermissionsForRoute(pathname);

  if (requiredPermissions.length > 0 && !hasAnyPermission(permissions, requiredPermissions)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Akses Ditolak</h1>
          <p className="text-slate-600">Anda tidak memiliki akses ke halaman ini</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

