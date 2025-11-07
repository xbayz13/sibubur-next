import apiClient from '../api';
import { Production } from '@/types';

export interface CreateProductionDto {
  date: string;
  storeId: number;
  weatherId?: number;
  porridgeAmount?: number;
  supplies?: Array<{
    supplyId: number;
    quantity: number;
  }>;
}

export interface UpdateProductionDto {
  date?: string;
  storeId?: number;
  weatherId?: number;
  porridgeAmount?: number;
  supplies?: Array<{
    supplyId: number;
    quantity: number;
  }>;
}

export const productionsService = {
  async getAll(storeId?: number, date?: string): Promise<Production[]> {
    const params: any = {};
    if (storeId) params.storeId = storeId;
    if (date) params.date = date;
    const response = await apiClient.get<Production[]>('/productions', { params });
    return response.data;
  },

  async getById(id: number): Promise<Production> {
    const response = await apiClient.get<Production>(`/productions/${id}`);
    return response.data;
  },

  async create(production: CreateProductionDto): Promise<Production> {
    const response = await apiClient.post<Production>('/productions', production);
    return response.data;
  },

  async update(id: number, production: UpdateProductionDto): Promise<Production> {
    const response = await apiClient.patch<Production>(`/productions/${id}`, production);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/productions/${id}`);
  },
};

