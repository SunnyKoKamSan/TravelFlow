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
    const res = await safeFetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`,
      2000
    );
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      return { lat: data.results[0].latitude, lon: data.results[0].longitude };
    }
    return { lat: 0, lon: 0 };
  } catch {
    return { lat: 0, lon: 0 };
  }
};

// Weather API
export const fetchWeather = async (lat: number, lon: number): Promise<WeatherData | null> => {
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
      : null;
  } catch (e) {
    return null;
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

// Gemini AI API
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

export const generateAIItinerary = async (destination: string): Promise<Array<{ dayIndex: number; time: string; location: string; note: string }>> => {
  if (!GEMINI_API_KEY) throw new Error('Gemini API key not configured');
  
  const prompt = `Generate a 3-day travel itinerary for ${destination}. 
    Respond ONLY with valid JSON. Format: 
    [{"dayIndex":0, "time":"10:00", "location":"Name", "note":"Activity description"}, ...]`;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        signal: controller.signal,
      }
    );
    clearTimeout(id);

    if (!response.ok) throw new Error('API Request Failed');

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    const jsonStr = text.replace(/```json|```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
};

export const askAI = async (location: string): Promise<string> => {
  if (!GEMINI_API_KEY) throw new Error('Gemini API key not configured');
  
  const prompt = `I am at ${location}. Suggest 3 hidden gem restaurants or unique activities nearby. Keep it brief.`;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        signal: controller.signal,
      }
    );
    clearTimeout(id);

    if (!response.ok) throw new Error('API Request Failed');

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (e) {
    clearTimeout(id);
    throw new Error('AI service unavailable');
  }
};
