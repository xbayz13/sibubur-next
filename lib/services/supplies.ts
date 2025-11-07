import apiClient from '../api';
import { Supply } from '@/types';

export interface CreateSupplyDto {
  name: string;
  unit: string;
  stock: number;
  minStock: number;
  price?: number;
}

export interface UpdateSupplyDto {
  name?: string;
  unit?: string;
  stock?: number;
  minStock?: number;
  price?: number;
}

export const suppliesService = {
  async getAll(): Promise<Supply[]> {
    const response = await apiClient.get<Supply[]>('/supplies');
    return response.data;
  },

  async getById(id: number): Promise<Supply> {
    const response = await apiClient.get<Supply>(`/supplies/${id}`);
    return response.data;
  },

  async getLowStock(): Promise<Supply[]> {
    const response = await apiClient.get<Supply[]>('/supplies/low-stock');
    return response.data;
  },

  async create(supply: CreateSupplyDto): Promise<Supply> {
    const response = await apiClient.post<Supply>('/supplies', supply);
    return response.data;
  },

  async update(id: number, supply: UpdateSupplyDto): Promise<Supply> {
    const response = await apiClient.patch<Supply>(`/supplies/${id}`, supply);
    return response.data;
  },

  async restock(id: number, quantity: number): Promise<Supply> {
    const response = await apiClient.patch<Supply>(`/supplies/${id}/restock`, { quantity });
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/supplies/${id}`);
  },
};

