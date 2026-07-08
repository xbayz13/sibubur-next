import apiClient from '../api';
import { Product, ProductCategory, ProductAddon, PaginatedResponse } from '@/types';

type ProductWithAddons = Product & {
  productAddons?: Array<{ addon: ProductAddon; addonPriceOverride?: number }>;
};

const transformProduct = (product: ProductWithAddons) => ({
  ...product,
  addons: product.productAddons?.map((pap) => ({
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
      const response = await apiClient.get<PaginatedResponse<ProductWithAddons>>('/products', { params: queryParams });
      const rawData = response.data.data || [];
      return {
        data: rawData.map(transformProduct),
        total: response.data.total,
        page: response.data.page,
        limit: response.data.limit,
        totalPages: response.data.totalPages,
      };
    } catch (error: unknown) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },

  async getById(id: number): Promise<Product> {
    const response = await apiClient.get<Product>(`/products/${id}`);
    const product = response.data as ProductWithAddons;
    // Transform productAddons to addons for easier use
    return {
      ...product,
      addons: product.productAddons?.map((pap) => ({
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
    const response = await apiClient.post<ProductWithAddons>(`/products/${productId}/addons`, {
      addonId,
      addonPriceOverride,
    });
    const product = response.data as ProductWithAddons;
    return {
      ...product,
      addons: product.productAddons?.map((pap) => ({
        id: pap.addon.id,
        name: pap.addon.name,
        price: pap.addonPriceOverride || pap.addon.price,
        description: pap.addon.description,
      })) || [],
    };
  },

  async removeAddon(productId: number, addonId: number): Promise<Product> {
    const response = await apiClient.delete<ProductWithAddons>(`/products/${productId}/addons/${addonId}`);
    const product = response.data as ProductWithAddons;
    return {
      ...product,
      addons: product.productAddons?.map((pap) => ({
        id: pap.addon.id,
        name: pap.addon.name,
        price: pap.addonPriceOverride || pap.addon.price,
        description: pap.addon.description,
      })) || [],
    };
  },
};
