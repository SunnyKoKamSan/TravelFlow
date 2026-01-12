import axios from 'axios';
import config from '@/config/index.js';

interface GeocodeResult {
  latitude: number;
  longitude: number;
  name: string;
  country: string;
}

interface WeatherData {
  temp: number;
  code: number;
  description: string;
}

export class LocationService {
  async searchLocation(query: string): Promise<GeocodeResult[]> {
    try {
      const response = await axios.get(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          query
        )}&count=5&language=en&format=json`,
        { timeout: config.GEOCODING_TIMEOUT }
      );

      return response.data.results?.map((result: any) => ({
        latitude: result.latitude,
        longitude: result.longitude,
        name: result.name,
        country: result.country,
      })) || [];
    } catch (error) {
      console.error('Geocoding search error:', error);
      return [];
    }
  }

  async getCoordinates(
    location: string
  ): Promise<{ lat: number; lon: number } | null> {
    try {
      // Try primary geocoding API
      const response = await axios.get(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          location
        )}&count=1&language=en&format=json`,
        { timeout: config.GEOCODING_TIMEOUT }
      );

      if (response.data.results && response.data.results.length > 0) {
        return {
          lat: response.data.results[0].latitude,
          lon: response.data.results[0].longitude,
        };
      }

      // Fallback to Nominatim
      console.warn(`Open-Meteo couldn't find "${location}", trying Nominatim...`);
      const nominatimResponse = await axios.get(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          location
        )}&format=json&limit=1`,
        { timeout: config.GEOCODING_TIMEOUT }
      );

      if (nominatimResponse.data && nominatimResponse.data.length > 0) {
        return {
          lat: parseFloat(nominatimResponse.data[0].lat),
          lon: parseFloat(nominatimResponse.data[0].lon),
        };
      }

      return null;
    } catch (error) {
      console.error(`Geocoding error for "${location}":`, error);
      return null;
    }
  }

  async getWeather(lat: number, lon: number): Promise<WeatherData | null> {
    try {
      const response = await axios.get(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`,
        { timeout: config.WEATHER_TIMEOUT }
      );

      if (response.data.current_weather) {
        return {
          temp: Math.round(response.data.current_weather.temperature),
          code: response.data.current_weather.weathercode,
          description: this.getWeatherDescription(
            response.data.current_weather.weathercode
          ),
        };
      }

      return null;
    } catch (error) {
      console.error('Weather fetch error:', error);
      return null;
    }
  }

  private getWeatherDescription(code: number): string {
    if (code === 0) return 'Clear sky';
    if (code < 4) return 'Mostly clear';
    if (code < 50) return 'Cloudy';
    if (code < 70) return 'Rainy';
    if (code < 80) return 'Snowy';
    return 'Stormy';
  }

  async getCountryInfo(countryCode: string): Promise<{
    currencyCode: string;
    currencySymbol: string;
  } | null> {
    try {
      const response = await axios.get(
        `https://restcountries.com/v3.1/alpha/${countryCode}`,
        { timeout: config.GEOCODING_TIMEOUT }
      );

      const countryInfo = response.data[0];
      const currencyKey = Object.keys(countryInfo.currencies)[0];

      return {
        currencyCode: currencyKey,
        currencySymbol: countryInfo.currencies[currencyKey].symbol || '$',
      };
    } catch (error) {
      console.error('Country info error:', error);
      return null;
    }
  }
}

export default new LocationService();
