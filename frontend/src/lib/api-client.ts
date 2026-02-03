/**
 * API Client for TravelFlow Pro Backend
 * Handles all communication with the backend API
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_TIMEOUT = 30000;

class APIClient {
  private baseURL: string;

  constructor(baseURL = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || error.details || `API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string }> {
    return this.request('/health');
  }
}

export const apiClient = new APIClient();

// Utility functions for external APIs
export const getCoordinates = async (location: string) => {
  try {
    // Using OpenStreetMap Nominatim API for geocoding
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`,
      { signal: AbortSignal.timeout(5000) }
    );
    const data = await res.json();
    if (data && data[0]) {
      return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
    }
    return { lat: 0, lon: 0 };
  } catch (error) {
    console.error('Failed to get coordinates:', error);
    return { lat: 0, lon: 0 };
  }
};

export const fetchWeather = async (lat: number, lon: number) => {
  try {
    // Using Open-Meteo free weather API
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`,
      { signal: AbortSignal.timeout(5000) }
    );
    const data = await res.json();
    return data.current_weather;
  } catch (error) {
    console.error('Failed to fetch weather:', error);
    return undefined;
  }
};

export const fetchExchangeRate = async (currencyCode: string): Promise<number> => {
  if (currencyCode === 'HKD') return 1;
  try {
    const res = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${currencyCode}`,
      { signal: AbortSignal.timeout(2000) }
    );
    const data = await res.json();
    return data.rates?.HKD || 1;
  } catch (e) {
    return 1;
  }
};

export const translateText = async (
  text: string,
  targetLang: string
): Promise<string> => {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const data = await res.json();
    if (data && data[0] && data[0][0]) {
      return data[0][0][0];
    }
    return 'Translation error.';
  } catch (e) {
    return 'Translation error.';
  }
};

export const getAirlineFromCode = (code: string) => {
  const airlines: Record<string, string> = {
    'CX': 'Cathay Pacific',
    'KA': 'Cathay Dragon',
    'HX': 'Hong Kong Airlines',
    'UO': 'Hong Kong Express',
  };
  return airlines[code.toUpperCase().substring(0, 2)] || null;
};

export default apiClient;
