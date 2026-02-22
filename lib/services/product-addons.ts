import apiClient from '../api';
import { ProductAddon, PaginatedResponse } from '@/types';

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

export interface ProductAddonsGetAllParams {
  page?: number;
  limit?: number;
}

export const productAddonsService = {
  async getAll(params?: ProductAddonsGetAllParams): Promise<PaginatedResponse<ProductAddon>> {
    const queryParams = { page: params?.page ?? 1, limit: params?.limit ?? 50 };
    const response = await apiClient.get<PaginatedResponse<ProductAddon>>('/product-addons', { params: queryParams });
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

