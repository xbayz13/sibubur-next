import apiClient from '../api';
import { ProductAddon } from '@/types';

export interface CreateProductAddonDto {
  name: string;
  price: number;
  description?: string;
}

export interface UpdateProductAddonDto {
  name?: string;
  price?: number;
  description?: string;
}

export const productAddonsService = {
  async getAll(): Promise<ProductAddon[]> {
    const response = await apiClient.get<ProductAddon[]>('/product-addons');
    return response.data;
  },

  async getById(id: number): Promise<ProductAddon> {
    const response = await apiClient.get<ProductAddon>(`/product-addons/${id}`);
    return response.data;
  },

  async create(addon: CreateProductAddonDto): Promise<ProductAddon> {
    const response = await apiClient.post<ProductAddon>('/product-addons', addon);
    return response.data;
  },

  async update(id: number, addon: UpdateProductAddonDto): Promise<ProductAddon> {
    const response = await apiClient.patch<ProductAddon>(`/product-addons/${id}`, addon);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/product-addons/${id}`);
  },
};

