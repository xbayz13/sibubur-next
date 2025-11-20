import apiClient from '../api';
import { Product, ProductCategory, ProductAddon } from '@/types';

export const productsService = {
  async getAll(): Promise<Product[]> {
    try {
      const response = await apiClient.get<Product[]>('/products');
      console.log('Products API response:', response.data);
      // Transform productAddons to addons for easier use
      const transformed = (response.data || []).map((product: any) => ({
        ...product,
        addons: product.productAddons?.map((pap: any) => ({
          id: pap.addon?.id,
          name: pap.addon?.name,
          price: pap.addonPriceOverride || pap.addon?.price,
          description: pap.addon?.description,
        })) || [],
      }));
      console.log('Transformed products:', transformed);
      return transformed;
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
    const response = await apiClient.get<ProductCategory[]>('/product-categories');
    return response.data;
  },

  async getAddons(): Promise<ProductAddon[]> {
    const response = await apiClient.get<ProductAddon[]>('/product-addons');
    return response.data;
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

