import apiClient from '../api';
import { User } from '@/types';

export interface CreateUserDto {
  username: string;
  password: string;
  name: string;
  roleId: number;
}

export interface UpdateUserDto {
  username?: string;
  password?: string;
  name?: string;
  roleId?: number;
}

export const usersService = {
  async getAll(): Promise<User[]> {
    const response = await apiClient.get<User[]>('/users');
    return response.data;
  },

  async getById(id: number): Promise<User> {
    const response = await apiClient.get<User>(`/users/${id}`);
    return response.data;
  },

  async create(user: CreateUserDto): Promise<User> {
    const response = await apiClient.post<User>('/users', user);
    return response.data;
  },

  async update(id: number, user: UpdateUserDto): Promise<User> {
    const response = await apiClient.patch<User>(`/users/${id}`, user);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/users/${id}`);
  },
};

