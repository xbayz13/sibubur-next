import { LoginRequest, LoginResponse, User } from '@/types';
import apiClient from './api';

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    // Step 1: Login to get access token
    const loginResponse = await apiClient.post<{ access_token: string }>('/auth/login', credentials);
    
    if (!loginResponse.data.access_token) {
      throw new Error('No access token received');
    }

    // Store token immediately
    localStorage.setItem('token', loginResponse.data.access_token);

    // Step 2: Try to decode user info from JWT token
    // The backend login only returns access_token, so we decode the token to get user info
    let user: User = {
      id: 0,
      username: credentials.username,
    };

    try {
      // Decode JWT token to get user info (basic decoding without verification)
      const tokenParts = loginResponse.data.access_token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        user = {
          id: payload.sub || 0,
          username: payload.username || credentials.username,
          role: payload.roleId ? {
            id: payload.roleId,
            name: 'User', // Role name can be fetched separately if needed
          } : undefined,
        };
      }
    } catch (e) {
      console.warn('Could not decode token, using basic info:', e);
    }

    // Try to fetch full user profile (optional - if it fails, we still have basic info)
    try {
      const profileResponse = await apiClient.post<User | {
        id: number;
        username: string;
        roleId?: number;
      }>('/auth/profile', {});
      
      // Update user with profile data if available
      if (profileResponse.data) {
        user = {
          id: profileResponse.data.id || user.id,
          username: profileResponse.data.username || user.username,
          role: (profileResponse.data as any).role || user.role,
        };
      }
    } catch (error: any) {
      // Profile fetch is optional, so we continue with decoded token info
      console.warn('Could not fetch user profile (optional):', error?.response?.status || error.message);
    }

    localStorage.setItem('user', JSON.stringify(user));

    return {
      access_token: loginResponse.data.access_token,
      user,
    };
  },

  async logout(): Promise<void> {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  },

  getUser(): User | null {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};

