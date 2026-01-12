/**
 * API Client for TravelFlow Pro Backend
 * Handles all communication with the backend API
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_TIMEOUT = 30000; // 30 seconds for AI operations

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
   * Generate AI itinerary for a destination
   */
  async generateItinerary(
    destination: string,
    days: number = 3,
    interests?: string[]
  ): Promise<any> {
    return this.request('/api/ai/generate-itinerary', {
      method: 'POST',
      body: JSON.stringify({ destination, days, interests }),
    });
  }

  /**
   * Refine existing itinerary based on user feedback
   */
  async refineItinerary(
    currentItinerary: any[],
    destination: string,
    feedback: string,
    days?: number
  ): Promise<any> {
    return this.request('/api/ai/refine-itinerary', {
      method: 'POST',
      body: JSON.stringify({
        currentItinerary,
        destination,
        feedback,
        days,
      }),
    });
  }

  /**
   * Get recommendations for a location by type
   */
  async getRecommendations(
    location: string,
    type: 'restaurants' | 'attractions' | 'events' | 'general' = 'general'
  ): Promise<any> {
    const params = new URLSearchParams({
      location,
      type,
    });

    return this.request(`/api/ai/recommendations?${params.toString()}`);
  }

  /**
   * Search for a location
   */
  async searchLocation(query: string): Promise<any> {
    const params = new URLSearchParams({ query });
    return this.request(`/api/ai/search-location?${params.toString()}`);
  }

  /**
   * Get detailed location information (coordinates, weather, etc.)
   */
  async getLocationInfo(location: string): Promise<any> {
    const params = new URLSearchParams({ location });
    return this.request(`/api/ai/location-info?${params.toString()}`);
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string }> {
    return this.request('/health');
  }
}

export const apiClient = new APIClient();

// Legacy exports for backward compatibility
export const generateAIItinerary = (destination: string) =>
  apiClient.generateItinerary(destination);

export const askAI = (location: string) =>
  apiClient.getRecommendations(location, 'general');

export const getCoordinates = async (location: string) => {
  try {
    const info = await apiClient.getLocationInfo(location);
    return info.coordinates;
  } catch (error) {
    console.error('Failed to get coordinates:', error);
    return { lat: 0, lon: 0 };
  }
};

export const fetchWeather = async (_lat: number, _lon: number) => {
  try {
    // Would need a separate weather endpoint, or use the location info endpoint
    console.warn('fetchWeather: implement weather endpoint or use location-info');
    return undefined;
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

export const searchLocation = (query: string) =>
  apiClient.searchLocation(query);

export default apiClient;
