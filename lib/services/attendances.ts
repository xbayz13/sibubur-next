import apiClient from '../api';
import { Attendance, PaginatedResponse } from '@/types';

export interface CreateAttendanceDto {
  date: string;
  employeeId: number;
  status: 'present' | 'absent';
}

export interface UpdateAttendanceDto {
  date?: string;
  employeeId?: number;
  status?: 'present' | 'absent';
}

export interface AttendancesGetAllParams {
  employeeId?: number;
  date?: string;
  page?: number;
  limit?: number;
}

export const attendancesService = {
  async getAll(params?: AttendancesGetAllParams): Promise<PaginatedResponse<Attendance>> {
    const queryParams: Record<string, unknown> = { page: 1, limit: 50 };
    if (params?.employeeId) queryParams.employeeId = params.employeeId;
    if (params?.date) queryParams.date = params.date;
    if (params?.page) queryParams.page = params.page;
    if (params?.limit) queryParams.limit = params.limit;
    const response = await apiClient.get<PaginatedResponse<Attendance>>('/attendances', { params: queryParams });
    return response.data;
  },

  async getById(id: number): Promise<Attendance> {
    const response = await apiClient.get<Attendance>(`/attendances/${id}`);
    return response.data;
  },

  async create(attendance: CreateAttendanceDto): Promise<Attendance> {
    const response = await apiClient.post<Attendance>('/attendances', attendance);
    return response.data;
  },

  async update(id: number, attendance: UpdateAttendanceDto): Promise<Attendance> {
    const response = await apiClient.patch<Attendance>(`/attendances/${id}`, attendance);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/attendances/${id}`);
  },
};

