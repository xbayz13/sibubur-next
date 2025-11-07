import apiClient from '../api';
import { Permission } from '@/types';

export interface CreatePermissionDto {
  module: string;
  action: string;
  slug: string;
}

export interface UpdatePermissionDto {
  module?: string;
  action?: string;
  slug?: string;
}

export const permissionsService = {
  async getAll(module?: string): Promise<Permission[]> {
    const params = module ? { module } : {};
    const response = await apiClient.get<Permission[]>('/permissions', { params });
    return response.data;
  },

  async getById(id: number): Promise<Permission> {
    const response = await apiClient.get<Permission>(`/permissions/${id}`);
    return response.data;
  },

  async create(permission: CreatePermissionDto): Promise<Permission> {
    const response = await apiClient.post<Permission>('/permissions', permission);
    return response.data;
  },

  async update(id: number, permission: UpdatePermissionDto): Promise<Permission> {
    const response = await apiClient.patch<Permission>(`/permissions/${id}`, permission);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/permissions/${id}`);
  },
};

