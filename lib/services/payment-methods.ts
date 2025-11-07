import apiClient from '../api';
import { PaymentMethod } from '@/types';

export const paymentMethodsService = {
  async getAll(): Promise<PaymentMethod[]> {
    const response = await apiClient.get<PaymentMethod[]>('/payment-methods');
    return response.data;
  },

  async getById(id: number): Promise<PaymentMethod> {
    const response = await apiClient.get<PaymentMethod>(`/payment-methods/${id}`);
    return response.data;
  },
};

