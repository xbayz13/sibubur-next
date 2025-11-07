import apiClient from '../api';
import { Order, CreateOrderDto, UpdateOrderDto } from '@/types';

export const ordersService = {
  async getAll(storeId?: number, date?: string): Promise<Order[]> {
    const params: any = {};
    if (storeId) params.storeId = storeId;
    if (date) params.date = date;
    const response = await apiClient.get<Order[]>('/orders', { params });
    return response.data;
  },

  async getById(id: number): Promise<Order> {
    const response = await apiClient.get<Order>(`/orders/${id}`);
    return response.data;
  },

  async getByOrderNumber(orderNumber: string): Promise<Order> {
    const response = await apiClient.get<Order>(`/orders/number/${orderNumber}`);
    return response.data;
  },

  async create(order: CreateOrderDto): Promise<Order> {
    const response = await apiClient.post<Order>('/orders', order);
    return response.data;
  },

  async update(id: number, order: UpdateOrderDto): Promise<Order> {
    const response = await apiClient.patch<Order>(`/orders/${id}`, order);
    return response.data;
  },

  async cancel(id: number): Promise<Order> {
    const response = await apiClient.patch<Order>(`/orders/${id}/cancel`);
    return response.data;
  },

  async markAsPaid(id: number): Promise<Order> {
    const response = await apiClient.patch<Order>(`/orders/${id}/paid`);
    return response.data;
  },
};

