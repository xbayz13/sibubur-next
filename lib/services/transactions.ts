import apiClient from '../api';
import { Transaction } from '@/types';

export interface CreateTransactionDto {
  orderId: number;
  paymentMethodId: number;
  amount: number;
  storeId: number;
}

export const transactionsService = {
  async getAll(storeId?: number, date?: string): Promise<Transaction[]> {
    const params: any = {};
    if (storeId) params.storeId = storeId;
    if (date) params.date = date;
    const response = await apiClient.get<Transaction[]>('/transactions', { params });
    return response.data;
  },

  async getById(id: number): Promise<Transaction> {
    const response = await apiClient.get<Transaction>(`/transactions/${id}`);
    return response.data;
  },

  async create(transaction: CreateTransactionDto): Promise<Transaction> {
    const response = await apiClient.post<Transaction>('/transactions', transaction);
    return response.data;
  },
};

