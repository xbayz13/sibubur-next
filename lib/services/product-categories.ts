import apiClient from '../api';
import { ProductCategory, PaginatedResponse } from '@/types';

export interface CreateProductCategoryDto {
  name: string;
  description?: string;
}

export interface UpdateProductCategoryDto {
  name?: string;
  description?: string;
}

export interface ProductCategoriesGetAllParams {
  page?: number;
  limit?: number;
}

export const productCategoriesService = {
  async getAll(params?: ProductCategoriesGetAllParams): Promise<PaginatedResponse<ProductCategory>> {
    const queryParams = { page: params?.page ?? 1, limit: params?.limit ?? 50 };
    const response = await apiClient.get<PaginatedResponse<ProductCategory>>('/product-categories', { params: queryParams });
    return response.data;
  },

  async getById(id: number): Promise<ProductCategory> {
    const response = await apiClient.get<ProductCategory>(`/product-categories/${id}`);
    return response.data;
  },

  async create(category: CreateProductCategoryDto): Promise<ProductCategory> {
    const response = await apiClient.post<ProductCategory>('/product-categories', category);
    return response.data;
  },

  async update(id: number, category: UpdateProductCategoryDto): Promise<ProductCategory> {
    const response = await apiClient.patch<ProductCategory>(`/product-categories/${id}`, category);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/product-categories/${id}`);
  },
};

