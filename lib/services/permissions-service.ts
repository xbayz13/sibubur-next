import apiClient from '../api';
import { Permission } from '@/types';

// Service to check user permissions
export const permissionsService = {
  // Get user permissions (from role)
  async getUserPermissions(): Promise<string[]> {
    try {
      // Get user profile which now includes permissions
      const profileResponse = await apiClient.get('/auth/profile');
      const profileData = profileResponse.data;
      
      // Check if SuperAdmin or Owner - they have all permissions
      if (profileData.roleName === 'SuperAdmin' || profileData.roleName === 'Owner') {
        if (profileData.roleName === 'SuperAdmin') {
          return ['superadmin:*'];
        }
        // Owner has all permissions (returned from backend)
      }

      // Return permissions from profile response
      return profileData.permissions || [];
    } catch (error: any) {
      console.error('Failed to fetch user permissions:', error);
      
      // If 401 or 404, the user doesn't exist (token is invalid)
      // The API interceptor should handle redirecting to login
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

  // Check if user has SuperAdmin or Owner role (bypasses all permission checks)
  async isSuperAdmin(): Promise<boolean> {
    try {
      const profileResponse = await apiClient.get('/auth/profile');
      const roleName = profileResponse.data.roleName;
      return roleName === 'SuperAdmin' || roleName === 'Owner';
    } catch (error: any) {
      // If 401 or 404, the user doesn't exist (token is invalid)
      // The API interceptor should handle redirecting to login
      console.error('Failed to check SuperAdmin status:', error);
      return false;
    }
  },
};

