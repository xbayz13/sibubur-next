import apiClient from '../api';
import { Weather } from '@/types';

export interface CreateWeatherDto {
  date: string;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'stormy';
  temperature?: number;
  description?: string;
}

export interface UpdateWeatherDto {
  condition?: 'sunny' | 'cloudy' | 'rainy' | 'stormy';
  temperature?: number;
  description?: string;
}

// Transform weather data to include computed fields
const transformWeather = (weather: Partial<Weather> & { weatherJson?: Weather['weatherJson'] }): Weather => {
  const condition = weather.weatherJson?.condition;
  const temperature = weather.weatherJson?.temperature;
  const description = weather.weatherJson?.description;

  return {
    id: (weather as Weather).id,
    date: (weather as Weather).date,
    locationName: weather.locationName,
    locationCode: weather.locationCode,
    weatherJson: weather.weatherJson,
    condition,
    temperature,
    description,
  };
};

export const weatherService = {
  async getAll(params?: { page?: number; limit?: number }): Promise<{ data: Weather[]; total: number; page: number; limit: number; totalPages: number }> {
    const queryParams = { page: params?.page ?? 1, limit: params?.limit ?? 50 };
    const response = await apiClient.get<{ data: Array<Partial<Weather>>; total: number; page: number; limit: number; totalPages: number }>('/weather', { params: queryParams });
    return {
      ...response.data,
      data: response.data.data.map(transformWeather),
    };
  },

  async getByDate(date: string): Promise<Weather | null> {
    try {
      const response = await apiClient.get<Weather>(`/weather/date/${date}`);
      return transformWeather(response.data);
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const status = (error as { response?: { status?: number } }).response?.status;
        if (status === 404) {
          return null;
        }
      }
      throw error;
    }
  },

  async create(weather: CreateWeatherDto): Promise<Weather> {
    // Transform frontend format to backend format
    const backendWeather = {
      date: weather.date,
      locationName: undefined,
      locationCode: undefined,
      weatherJson: {
        condition: weather.condition,
        temperature: weather.temperature,
        description: weather.description,
      },
    };
    const response = await apiClient.post<Weather>('/weather', backendWeather);
    return transformWeather(response.data);
  },

  async update(id: number, weather: UpdateWeatherDto): Promise<Weather> {
    // Transform frontend format to backend format
    const backendWeather: { weatherJson?: Record<string, unknown> } = {};
    if (weather.condition !== undefined || weather.temperature !== undefined || weather.description !== undefined) {
      backendWeather.weatherJson = {};
      if (weather.condition !== undefined) {
        backendWeather.weatherJson.condition = weather.condition;
      }
      if (weather.temperature !== undefined) {
        backendWeather.weatherJson.temperature = weather.temperature;
      }
      if (weather.description !== undefined) {
        backendWeather.weatherJson.description = weather.description;
      }
    }
    const response = await apiClient.patch<Weather>(`/weather/${id}`, backendWeather);
    return transformWeather(response.data);
  },
};
