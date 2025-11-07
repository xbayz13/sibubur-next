import apiClient from '../api';
import { Expense } from '@/types';

export interface CreateExpenseDto {
  expenseCategoryId: number;
  storeId: number;
  totalAmount: number;
}

export interface UpdateExpenseDto {
  expenseCategoryId?: number;
  storeId?: number;
  totalAmount?: number;
}

export const expensesService = {
  async getAll(storeId?: number, date?: string): Promise<Expense[]> {
    const params: any = {};
    if (storeId) params.storeId = storeId;
    if (date) params.date = date;
    const response = await apiClient.get<Expense[]>('/expenses', { params });
    return response.data;
  },

  async getById(id: number): Promise<Expense> {
    const response = await apiClient.get<Expense>(`/expenses/${id}`);
    return response.data;
  },

  async create(expense: CreateExpenseDto): Promise<Expense> {
    const response = await apiClient.post<Expense>('/expenses', expense);
    return response.data;
  },

  async update(id: number, expense: UpdateExpenseDto): Promise<Expense> {
    const response = await apiClient.patch<Expense>(`/expenses/${id}`, expense);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/expenses/${id}`);
  },
};

