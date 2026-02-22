import apiClient from '../api';
import { Product, ProductCategory, ProductAddon, PaginatedResponse } from '@/types';

const transformProduct = (product: any) => ({
  ...product,
  addons: product.productAddons?.map((pap: any) => ({
    id: pap.addon?.id,
    name: pap.addon?.name,
    price: pap.addonPriceOverride || pap.addon?.price,
    description: pap.addon?.description,
  })) || [],
});

export interface ProductsGetAllParams {
  page?: number;
  limit?: number;
}

export const productsService = {
  async getAll(params?: ProductsGetAllParams): Promise<PaginatedResponse<Product>> {
    try {
      const queryParams = { page: params?.page ?? 1, limit: params?.limit ?? 50 };
      const response = await apiClient.get<PaginatedResponse<any>>('/products', { params: queryParams });
      const rawData = response.data.data || [];
      return {
        data: rawData.map(transformProduct),
        total: response.data.total,
        page: response.data.page,
        limit: response.data.limit,
        totalPages: response.data.totalPages,
      };
    } catch (error: any) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },

  async getById(id: number): Promise<Product> {
    const response = await apiClient.get<Product>(`/products/${id}`);
    const product: any = response.data;
    // Transform productAddons to addons for easier use
    return {
      ...product,
      addons: product.productAddons?.map((pap: any) => ({
        id: pap.addon.id,
        name: pap.addon.name,
        price: pap.addonPriceOverride || pap.addon.price,
        description: pap.addon.description,
      })) || [],
    };
  },

  async getCategories(): Promise<ProductCategory[]> {
    const response = await apiClient.get<PaginatedResponse<ProductCategory>>('/product-categories', { params: { limit: 100 } });
    return response.data.data || [];
  },

  async getAddons(): Promise<ProductAddon[]> {
    const response = await apiClient.get<PaginatedResponse<ProductAddon>>('/product-addons', { params: { limit: 100 } });
    return response.data.data || [];
  },

  async create(product: {
    name: string;
    description?: string;
    price: number;
    productCategoryId?: number;
    pictureId?: number;
  }): Promise<Product> {
    const response = await apiClient.post<Product>('/products', product);
    return response.data;
  },

  async update(id: number, product: {
    name?: string;
    description?: string;
    price?: number;
    productCategoryId?: number;
    pictureId?: number;
  }): Promise<Product> {
    const response = await apiClient.patch<Product>(`/products/${id}`, product);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/products/${id}`);
  },

  async addAddon(productId: number, addonId: number, addonPriceOverride?: number): Promise<Product> {
    const response = await apiClient.post<Product>(`/products/${productId}/addons`, {
      addonId,
      addonPriceOverride,
    });
    const product: any = response.data;
    return {
      ...product,
      addons: product.productAddons?.map((pap: any) => ({
        id: pap.addon.id,
        name: pap.addon.name,
        price: pap.addonPriceOverride || pap.addon.price,
        description: pap.addon.description,
      })) || [],
    };
  },

  async removeAddon(productId: number, addonId: number): Promise<Product> {
    const response = await apiClient.delete<Product>(`/products/${productId}/addons/${addonId}`);
    const product: any = response.data;
    return {
      ...product,
      addons: product.productAddons?.map((pap: any) => ({
        id: pap.addon.id,
        name: pap.addon.name,
        price: pap.addonPriceOverride || pap.addon.price,
        description: pap.addon.description,
      })) || [],
    };
  },
};

