import { GeocodeResult, WeatherData } from '@/types';

const API_TIMEOUT = 3000;

// Safe fetch with timeout
export const safeFetch = async (url: string, timeout = API_TIMEOUT): Promise<Response> => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
};

// Geocoding API
export const searchLocation = async (query: string): Promise<GeocodeResult[]> => {
  try {
    const res = await safeFetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`,
      3000
    );
    const data = await res.json();
    return data.results || [];
  } catch (e) {
    console.error('Geocoding error:', e);
    return [];
  }
};

export const getCoordinates = async (location: string): Promise<{ lat: number; lon: number }> => {
  try {
    // Try primary geocoding API
    const res = await safeFetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`,
      2000
    );
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      return { lat: data.results[0].latitude, lon: data.results[0].longitude };
    }

    // Fallback: Try Nominatim (OpenStreetMap) for better international support
    console.warn(`Open-Meteo couldn't find "${location}", trying Nominatim...`);
    const nominatimRes = await safeFetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`,
      3000
    );
    const nominatimData = await nominatimRes.json();
    if (nominatimData && nominatimData.length > 0) {
      return { lat: parseFloat(nominatimData[0].lat), lon: parseFloat(nominatimData[0].lon) };
    }

    console.warn(`Could not find coordinates for "${location}"`);
    return { lat: 0, lon: 0 };
  } catch (e) {
    console.error(`Geocoding error for "${location}":`, e);
    return { lat: 0, lon: 0 };
  }
};

// Weather API
export const fetchWeather = async (lat: number, lon: number): Promise<WeatherData | undefined> => {
  try {
    const res = await safeFetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`,
      2000
    );
    const data = await res.json();
    return data.current_weather
      ? {
          temp: Math.round(data.current_weather.temperature),
          code: data.current_weather.weathercode,
        }
      : undefined;
  } catch (e) {
    return undefined;
  }
};

export const getWeatherIcon = (code: number): string => {
  if (code === 0) return 'ph-sun';
  if (code < 4) return 'ph-cloud-sun';
  if (code < 50) return 'ph-cloud-fog';
  if (code < 70) return 'ph-cloud-rain';
  if (code < 80) return 'ph-cloud-snow';
  return 'ph-cloud-lightning';
};

// Country API
export const getCountryInfo = async (countryCode: string): Promise<{ currencyCode: string; currencySymbol: string; langName: string } | null> => {
  try {
    const res = await safeFetch(`https://restcountries.com/v3.1/alpha/${countryCode}`, 3000);
    const data = await res.json();
    const countryInfo = data[0];
    const currencyKey = Object.keys(countryInfo.currencies)[0];
    return {
      currencyCode: currencyKey,
      currencySymbol: countryInfo.currencies[currencyKey].symbol || '$',
      langName: Object.values(countryInfo.languages)[0] as string,
    };
  } catch (err) {
    console.log('Country API failed, using defaults');
    return null;
  }
};

// Exchange Rate API
export const fetchExchangeRate = async (currencyCode: string): Promise<number> => {
  if (currencyCode === 'HKD') return 1;
  try {
    const res = await safeFetch(`https://api.exchangerate-api.com/v4/latest/${currencyCode}`, 2000);
    const data = await res.json();
    return data.rates?.HKD || 1;
  } catch (e) {
    return 1;
  }
};

// Google Translate API
export const translateText = async (text: string, targetLang: string): Promise<string> => {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await safeFetch(url, 5000);
    const data = await res.json();
    if (data && data[0] && data[0][0]) {
      return data[0][0][0];
    }
    return 'Translation error.';
  } catch (e) {
    return 'Translation error.';
  }
};

// AI API - Using Hugging Face Inference API (free tier, no VPN required)
// Sign up for free at https://huggingface.co and create an API key
const HF_API_KEY = import.meta.env.VITE_HF_API_KEY || '';

// Fallback itinerary generator for when API is unavailable
const generateFallbackItinerary = (destination: string): Array<{ dayIndex: number; time: string; location: string; note: string }> => {
  return [
    { dayIndex: 0, time: '10:00', location: `${destination} City Center`, note: 'Arrival & city exploration' },
    { dayIndex: 0, time: '14:00', location: `${destination} Main Square`, note: 'Local attractions' },
    { dayIndex: 0, time: '18:00', location: `${destination} Restaurant District`, note: 'Dinner experience' },
    { dayIndex: 1, time: '09:00', location: `${destination} Historical Sites`, note: 'Cultural tour' },
    { dayIndex: 1, time: '13:00', location: `${destination} Museum`, note: 'Art & history' },
    { dayIndex: 1, time: '17:00', location: `${destination} Parks`, note: 'Nature & relaxation' },
    { dayIndex: 2, time: '10:00', location: `${destination} Markets`, note: 'Shopping & local culture' },
    { dayIndex: 2, time: '14:00', location: `${destination} Scenic Viewpoint`, note: 'Photography spot' },
    { dayIndex: 2, time: '17:00', location: `Airport Departure`, note: 'Departure' },
  ];
};

export const generateAIItinerary = async (destination: string): Promise<Array<{ dayIndex: number; time: string; location: string; note: string }>> => {
  try {
    if (!HF_API_KEY) {
      console.warn('No HF_API_KEY configured, using fallback itinerary');
      return generateFallbackItinerary(destination);
    }

    const prompt = `Generate a concise 3-day travel itinerary for ${destination}. Return ONLY valid JSON array with no markdown, no extra text. Format: [{"dayIndex":0,"time":"10:00","location":"Place Name","note":"Brief activity"}]`;

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(
      'https://api-inference.huggingface.co/models/meta-llama/Llama-2-7b-chat-hf',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 500,
            temperature: 0.7,
            top_p: 0.9,
          },
        }),
        signal: controller.signal,
      }
    );
    clearTimeout(id);

    if (!response.ok) {
      if (response.status === 429) {
        console.warn('HF API rate limited, using fallback itinerary');
        return generateFallbackItinerary(destination);
      }
      throw new Error(`API returned status ${response.status}`);
    }

    const data = await response.json();
    let text = data[0]?.generated_text || '';

    // Extract JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.warn('Could not extract JSON from AI response, using fallback');
      return generateFallbackItinerary(destination);
    }

    const jsonStr = jsonMatch[0];
    const itinerary = JSON.parse(jsonStr);

    // Validate itinerary structure
    if (!Array.isArray(itinerary) || itinerary.length === 0) {
      return generateFallbackItinerary(destination);
    }

    return itinerary;
  } catch (e) {
    console.warn('AI itinerary generation failed, using fallback', e);
    return generateFallbackItinerary(destination);
  }
};

// Fallback recommendations for when API is unavailable
const generateFallbackRecommendations = (location: string): string => {
  return `Here are some suggestions for ${location}:\n\n1. **Local Street Food**: Try the traditional street vendors and night markets\n2. **Historical Temples/Shrines**: Visit historic religious sites and cultural landmarks\n3. **Modern Shopping Districts**: Explore contemporary shopping areas and local boutiques\n\nTip: Ask locals for the best hidden gems - they often know the best spots!`;
};

export const askAI = async (location: string): Promise<string> => {
  try {
    if (!HF_API_KEY) {
      console.warn('No HF_API_KEY configured, using fallback recommendations');
      return generateFallbackRecommendations(location);
    }

    const prompt = `Suggest 3 hidden gem restaurants or unique activities near ${location}. Keep it concise (2-3 sentences per suggestion). Format as a simple list.`;

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(
      'https://api-inference.huggingface.co/models/meta-llama/Llama-2-7b-chat-hf',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 300,
            temperature: 0.7,
            top_p: 0.9,
          },
        }),
        signal: controller.signal,
      }
    );
    clearTimeout(id);

    if (!response.ok) {
      if (response.status === 429) {
        console.warn('HF API rate limited, using fallback recommendations');
        return generateFallbackRecommendations(location);
      }
      throw new Error(`API returned status ${response.status}`);
    }

    const data = await response.json();
    const text = data[0]?.generated_text || '';

    if (!text || text.length < 10) {
      return generateFallbackRecommendations(location);
    }

    // Extract useful content (remove prompt echo if present)
    const lines = text.split('\n').filter((l: string) => l.trim());
    const contentStart = lines.findIndex((l: string) => !l.includes(location) && l.length > 20);
    return lines.slice(contentStart > 0 ? contentStart : 0, contentStart > 0 ? contentStart + 5 : 5).join('\n') || generateFallbackRecommendations(location);
  } catch (e) {
    console.warn('AI recommendations failed, using fallback', e);
    return generateFallbackRecommendations(location);
  }
};
