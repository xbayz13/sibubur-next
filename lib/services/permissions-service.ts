import apiClient from '../api';
import { Permission } from '@/types';

// Service to check user permissions
export const permissionsService = {
  // Get user permissions (from role)
  async getUserPermissions(): Promise<string[]> {
    try {
      // First, get current user from profile (includes roleName from JWT)
      const profileResponse = await apiClient.post('/auth/profile', {});
      const profileData = profileResponse.data;
      
      // Check if SuperAdmin from JWT token
      if (profileData.roleName === 'SuperAdmin') {
        return ['superadmin:*'];
      }

      const userId = profileData.id || profileData.sub;
      if (!userId) {
        return [];
      }

      // Get user with role and permissions
      const userResponse = await apiClient.get(`/users/${userId}`);
      const user = userResponse.data;

      // If user is SuperAdmin, return all permissions
      if (user.role?.name === 'SuperAdmin') {
        return ['superadmin:*'];
      }

      // Extract permission slugs from role
      const permissions: string[] = [];
      if (user.role?.rolePermissions) {
        user.role.rolePermissions.forEach((rp: any) => {
          if (rp.permission?.slug) {
            permissions.push(rp.permission.slug);
          }
        });
      }

      return permissions;
    } catch (error) {
      console.error('Failed to fetch user permissions:', error);
      // Return empty array on error
      return [];
    }
  },

  // Check if user has a specific permission
  async hasPermission(permission: string): Promise<boolean> {
    try {
      const permissions = await this.getUserPermissions();
      
      // SuperAdmin has all permissions
      if (permissions.includes('superadmin:*')) {
        return true;
      }

      return permissions.includes(permission);
    } catch (error) {
      console.error('Permission check failed:', error);
      return false;
    }
  },

  // Check if user has SuperAdmin role (bypasses all permission checks)
  async isSuperAdmin(): Promise<boolean> {
    try {
      const profileResponse = await apiClient.post('/auth/profile', {});
      const roleName = profileResponse.data.roleName;
      return roleName === 'SuperAdmin';
    } catch (error) {
      return false;
    }
  },
};

