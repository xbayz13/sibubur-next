import apiClient from '../api';
import { Attendance } from '@/types';

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

export const attendancesService = {
  async getAll(employeeId?: number, date?: string): Promise<Attendance[]> {
    const params: any = {};
    if (employeeId) params.employeeId = employeeId;
    if (date) params.date = date;
    const response = await apiClient.get<Attendance[]>('/attendances', { params });
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

