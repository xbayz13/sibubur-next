import apiClient from '../api';
import { Order, CreateOrderDto, UpdateOrderDto, PaginatedResponse } from '@/types';

export interface OrdersGetAllParams {
  storeId?: number;
  date?: string;
  status?: 'open' | 'paid' | 'cancelled';
  page?: number;
  limit?: number;
}

export const ordersService = {
  async getAll(params?: OrdersGetAllParams): Promise<PaginatedResponse<Order>> {
    const queryParams: Record<string, unknown> = { page: 1, limit: 50 };
    if (params?.storeId) queryParams.storeId = params.storeId;
    if (params?.date) queryParams.date = params.date;
    if (params?.status) queryParams.status = params.status;
    if (params?.page) queryParams.page = params.page;
    if (params?.limit) queryParams.limit = params.limit;
    const response = await apiClient.get<PaginatedResponse<Order>>('/orders', { params: queryParams });
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

