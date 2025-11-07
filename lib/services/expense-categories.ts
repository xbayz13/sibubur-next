import apiClient from '../api';
import { ExpenseCategory } from '@/types';

export interface CreateExpenseCategoryDto {
  name: string;
  description?: string;
}

export interface UpdateExpenseCategoryDto {
  name?: string;
  description?: string;
}

export const expenseCategoriesService = {
  async getAll(): Promise<ExpenseCategory[]> {
    const response = await apiClient.get<ExpenseCategory[]>('/expense-categories');
    return response.data;
  },

  async getById(id: number): Promise<ExpenseCategory> {
    const response = await apiClient.get<ExpenseCategory>(`/expense-categories/${id}`);
    return response.data;
  },

  async create(category: CreateExpenseCategoryDto): Promise<ExpenseCategory> {
    const response = await apiClient.post<ExpenseCategory>('/expense-categories', category);
    return response.data;
  },

  async update(id: number, category: UpdateExpenseCategoryDto): Promise<ExpenseCategory> {
    const response = await apiClient.patch<ExpenseCategory>(`/expense-categories/${id}`, category);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/expense-categories/${id}`);
  },
};

