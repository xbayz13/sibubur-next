// BMKG Weather API Service
// Kode wilayah untuk Nologaten, Ponorogo, Jawa Timur
const BMKG_ADM4_CODE = '35.02.17.1015';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface BMKGWeatherForecast {
  location: {
    province: string;
    city: string;
    district: string;
    village: string;
    code: string;
    coordinates: {
      longitude: number;
      latitude: number;
    };
    timezone: string;
  };
  current: {
    temperature: number;
    condition: string;
    conditionEn: string;
    humidity: number;
    windSpeed: number;
    windDirection: string;
    visibility: string;
    precipitation: number;
    cloudCover: number;
    datetime: string;
    image: string;
  } | null;
  forecasts: {
    today: Array<{
      temperature: number;
      condition: string;
      humidity: number;
      windSpeed: number;
      precipitation: number;
      datetime: string;
      timeIndex: string;
    }>;
    tomorrow: Array<{
      temperature: number;
      condition: string;
      humidity: number;
      windSpeed: number;
      precipitation: number;
      datetime: string;
      timeIndex: string;
    }>;
    dayAfter: Array<{
      temperature: number;
      condition: string;
      humidity: number;
      windSpeed: number;
      precipitation: number;
      datetime: string;
      timeIndex: string;
    }>;
  };
}

export const bmkgService = {
  /**
   * Get weather forecast from BMKG API
   * No authentication required
   */
  async getForecast(adm4Code: string = BMKG_ADM4_CODE, transform: boolean = true): Promise<BMKGWeatherForecast> {
    const response = await fetch(
      `${API_BASE_URL}/weather/bmkg/forecast?adm4=${adm4Code}&transform=${transform}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch weather data: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Get current weather (latest forecast from today)
   */
  async getCurrentWeather(): Promise<BMKGWeatherForecast['current']> {
    const data = await this.getForecast();
    return data.current;
  },

  /**
   * Get tomorrow morning forecast (5-10 AM)
   */
  async getTomorrowMorningForecast(): Promise<BMKGWeatherForecast['forecasts']['tomorrow']> {
    const data = await this.getForecast();
    // Filter forecasts for tomorrow morning (5-10 AM)
    // datetime format: "2025-11-23 05:00:00" (local time)
    const morningForecasts = data.forecasts.tomorrow.filter((forecast) => {
      const datetime = new Date(forecast.datetime);
      const hour = datetime.getHours();
      // Filter for hours 5-10 (5 AM to 10 AM)
      return hour >= 5 && hour <= 10;
    });
    return morningForecasts;
  },

  /**
   * Map BMKG condition to our weather condition format
   */
  mapConditionToFormat(bmkgCondition: string): 'sunny' | 'cloudy' | 'rainy' | 'stormy' {
    const condition = bmkgCondition.toLowerCase();
    if (condition.includes('cerah')) return 'sunny';
    if (condition.includes('berawan')) return 'cloudy';
    if (condition.includes('hujan') || condition.includes('rain')) return 'rainy';
    if (condition.includes('badai') || condition.includes('storm')) return 'stormy';
    return 'cloudy'; // default
  },
};

