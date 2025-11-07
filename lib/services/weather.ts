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
const transformWeather = (weather: any): Weather => {
  const condition = weather.weatherJson?.condition;
  const temperature = weather.weatherJson?.temperature;
  const description = weather.weatherJson?.description;
  
  return {
    ...weather,
    condition,
    temperature,
    description,
  };
};

export const weatherService = {
  async getAll(): Promise<Weather[]> {
    const response = await apiClient.get<any[]>('/weather');
    return response.data.map(transformWeather);
  },

  async getByDate(date: string): Promise<Weather | null> {
    try {
      const response = await apiClient.get<any>(`/weather/date/${date}`);
      return transformWeather(response.data);
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
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
    const response = await apiClient.post<any>('/weather', backendWeather);
    return transformWeather(response.data);
  },

  async update(id: number, weather: UpdateWeatherDto): Promise<Weather> {
    // Transform frontend format to backend format
    const backendWeather: any = {};
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
    const response = await apiClient.patch<any>(`/weather/${id}`, backendWeather);
    return transformWeather(response.data);
  },
};

