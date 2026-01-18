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

// Country API - Enhanced with language code mapping
const COUNTRY_LANG_MAP: Record<string, { langCode: string; langName: string }> = {
  'JP': { langCode: 'ja', langName: 'Japanese' },
  'CN': { langCode: 'zh', langName: 'Chinese' },
  'TW': { langCode: 'zh-TW', langName: 'Chinese (Traditional)' },
  'HK': { langCode: 'zh-HK', langName: 'Cantonese' },
  'KR': { langCode: 'ko', langName: 'Korean' },
  'TH': { langCode: 'th', langName: 'Thai' },
  'VN': { langCode: 'vi', langName: 'Vietnamese' },
  'ID': { langCode: 'id', langName: 'Indonesian' },
  'MY': { langCode: 'ms', langName: 'Malay' },
  'SG': { langCode: 'en', langName: 'English' },
  'PH': { langCode: 'tl', langName: 'Filipino' },
  'FR': { langCode: 'fr', langName: 'French' },
  'DE': { langCode: 'de', langName: 'German' },
  'IT': { langCode: 'it', langName: 'Italian' },
  'ES': { langCode: 'es', langName: 'Spanish' },
  'PT': { langCode: 'pt', langName: 'Portuguese' },
  'NL': { langCode: 'nl', langName: 'Dutch' },
  'RU': { langCode: 'ru', langName: 'Russian' },
  'TR': { langCode: 'tr', langName: 'Turkish' },
  'AE': { langCode: 'ar', langName: 'Arabic' },
  'SA': { langCode: 'ar', langName: 'Arabic' },
  'IN': { langCode: 'hi', langName: 'Hindi' },
  'US': { langCode: 'en', langName: 'English' },
  'GB': { langCode: 'en', langName: 'English' },
  'AU': { langCode: 'en', langName: 'English' },
  'NZ': { langCode: 'en', langName: 'English' },
  'CA': { langCode: 'en', langName: 'English' },
  'MX': { langCode: 'es', langName: 'Spanish' },
  'BR': { langCode: 'pt', langName: 'Portuguese' },
  'AR': { langCode: 'es', langName: 'Spanish' },
  'GR': { langCode: 'el', langName: 'Greek' },
  'EG': { langCode: 'ar', langName: 'Arabic' },
  'ZA': { langCode: 'en', langName: 'English' },
  'KE': { langCode: 'sw', langName: 'Swahili' },
  'SE': { langCode: 'sv', langName: 'Swedish' },
  'NO': { langCode: 'no', langName: 'Norwegian' },
  'DK': { langCode: 'da', langName: 'Danish' },
  'FI': { langCode: 'fi', langName: 'Finnish' },
  'PL': { langCode: 'pl', langName: 'Polish' },
  'CZ': { langCode: 'cs', langName: 'Czech' },
  'AT': { langCode: 'de', langName: 'German' },
  'CH': { langCode: 'de', langName: 'German' },
  'BE': { langCode: 'nl', langName: 'Dutch' },
  'IE': { langCode: 'en', langName: 'English' },
};

export const getCountryInfo = async (countryCode: string): Promise<{ currencyCode: string; currencySymbol: string; langName: string; langCode: string } | null> => {
  try {
    const res = await safeFetch(`https://restcountries.com/v3.1/alpha/${countryCode}`, 3000);
    const data = await res.json();
    const countryInfo = data[0];
    const currencyKey = Object.keys(countryInfo.currencies)[0];
    
    // Get language info from our mapping first, fallback to API
    const langInfo = COUNTRY_LANG_MAP[countryCode.toUpperCase()];
    const apiLangName = Object.values(countryInfo.languages)[0] as string;
    
    return {
      currencyCode: currencyKey,
      currencySymbol: countryInfo.currencies[currencyKey].symbol || '$',
      langName: langInfo?.langName || apiLangName || 'English',
      langCode: langInfo?.langCode || countryCode.toLowerCase(),
    };
  } catch (err) {
    console.log('Country API failed, using defaults');
    // Try to at least return language info from our mapping
    const langInfo = COUNTRY_LANG_MAP[countryCode.toUpperCase()];
    if (langInfo) {
      return {
        currencyCode: 'USD',
        currencySymbol: '$',
        langName: langInfo.langName,
        langCode: langInfo.langCode,
      };
    }
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

// ===== Multi-Provider AI API =====
// Supports: Hugging Face, Google Gemini, Groq (Llama/Mixtral)
// Automatically falls back to next provider if one fails

// API Keys from environment
const HF_API_KEY = import.meta.env.VITE_HF_API_KEY || '';
const HF_MODEL = import.meta.env.VITE_HF_MODEL || 'mistralai/Mistral-7B-Instruct-v0.2';
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';

// Models
const GEMINI_MODEL = 'gemini-2.0-flash';
const GROQ_MODEL = 'llama-3.3-70b-versatile'; // Fast, free, good quality

// AI Provider types
type AIProvider = 'hf' | 'gemini' | 'groq';

// Call Gemini API
const callGeminiAPI = async (prompt: string, maxTokens: number = 2048): Promise<string | null> => {
  if (!GEMINI_API_KEY) return null;
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: maxTokens },
        }),
      }
    );
    
    if (!response.ok) {
      console.warn('Gemini API error:', response.status);
      return null;
    }
    
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (e) {
    console.warn('Gemini API failed:', e);
    return null;
  }
};

// Call Hugging Face Inference API
const callHuggingFaceAPI = async (prompt: string, maxTokens: number = 1024): Promise<string | null> => {
  if (!HF_API_KEY) return null;

  try {
    // Format prompt for instruction-tuned models (Mistral, Llama, Zephyr)
    const formattedPrompt = `<s>[INST] ${prompt} [/INST]`;
    
    const response = await fetch(`https://api-inference.huggingface.co/models/${HF_MODEL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${HF_API_KEY}`,
      },
      body: JSON.stringify({ 
        inputs: formattedPrompt, 
        parameters: { 
          max_new_tokens: Math.min(maxTokens, 2048), 
          temperature: 0.7,
          return_full_text: false,
        } 
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.warn('Hugging Face API error:', response.status, errorData);
      return null;
    }

    const data = await response.json();

    // Models can return different shapes; try common ones
    if (typeof data === 'string') return data;
    if (Array.isArray(data) && data[0]?.generated_text) return data[0].generated_text;
    if (data.generated_text) return data.generated_text;
    if (data.error) {
      console.warn('Hugging Face returned error:', data.error);
      return null;
    }

    // Fallback: attempt to extract text from common keys
    if (data && typeof data === 'object') {
      try {
        return JSON.stringify(data);
      } catch (e) {
        return null;
      }
    }

    return null;
  } catch (e) {
    console.warn('Hugging Face API failed:', e);
    return null;
  }
};

// Call Groq API (Free, fast Llama/Mixtral)
// If you can't access the Groq console (https://console.groq.com/keys), set a Hugging Face key
// in VITE_HF_API_KEY and the app will prefer Hugging Face as the primary fallback.
const callGroqAPI = async (prompt: string, maxTokens: number = 2048): Promise<string | null> => {
  if (!GROQ_API_KEY) return null;
  
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
    });
    
    if (!response.ok) {
      console.warn('Groq API error:', response.status);
      return null;
    }
    
    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (e) {
    console.warn('Groq API failed:', e);
    return null;
  }
};

// Universal AI call with automatic fallback
const callAI = async (prompt: string, maxTokens: number = 2048): Promise<string | null> => {
  // Try providers in order of preference: Hugging Face -> Gemini -> Groq
  const providers: { name: AIProvider; fn: () => Promise<string | null> }[] = [
    { name: 'hf', fn: () => callHuggingFaceAPI(prompt, maxTokens) },
    { name: 'gemini', fn: () => callGeminiAPI(prompt, maxTokens) },
    { name: 'groq', fn: () => callGroqAPI(prompt, maxTokens) },
  ];
  
  for (const provider of providers) {
    console.log(`Trying AI provider: ${provider.name}`);
    const result = await provider.fn();
    if (result) {
      console.log(`Success with ${provider.name}`);
      return result;
    }
  }
  
  console.warn('All AI providers failed');
  return null;
};

// Simple fallback when AI APIs fail - generates minimal placeholder structure
// This is only used as a last resort when no AI provider is available

const generateFallbackItinerary = (destination: string, days: number = 3, _departureCity?: string): Array<{ dayIndex: number; time: string; location: string; note: string; type?: string; transportMode?: string; origin?: string; endTime?: string }> => {
  const items: Array<{ dayIndex: number; time: string; location: string; note: string; type?: string; transportMode?: string; origin?: string; endTime?: string }> = [];
  
  // Basic placeholder structure - user should add their own activities
  // or retry AI generation when connection is available
  
  items.push(
    { dayIndex: 0, time: '10:00', location: `${destination} - Arrival`, note: 'Check-in and explore the area' },
    { dayIndex: 0, time: '18:00', location: `${destination} - Dinner`, note: 'Try local cuisine' },
  );
  
  for (let d = 1; d < days - 1; d++) {
    items.push(
      { dayIndex: d, time: '09:00', location: `Day ${d + 1} - Morning Activity`, note: 'Add your planned activity' },
      { dayIndex: d, time: '14:00', location: `Day ${d + 1} - Afternoon Activity`, note: 'Add your planned activity' },
      { dayIndex: d, time: '19:00', location: `Day ${d + 1} - Evening`, note: 'Dinner and entertainment' },
    );
  }
  
  const lastDay = days - 1;
  if (lastDay > 0) {
    items.push(
      { dayIndex: lastDay, time: '09:00', location: `${destination} - Last Day`, note: 'Final activities before departure' },
      { dayIndex: lastDay, time: '15:00', location: `Departure`, note: 'Head to airport/station' },
    );
  }
  
  return items;
};

interface AIItineraryParams {
  destination: string;
  days?: number;
  departureCity?: string;
  transportMode?: 'flight' | 'train' | 'car';
  interests?: string[];
}

export const generateAIItinerary = async (
  destination: string,
  params?: Partial<AIItineraryParams>
): Promise<Array<{ dayIndex: number; time: string; location: string; note: string; type?: string; transportMode?: string; origin?: string; endTime?: string }>> => {
  const days = params?.days || 3;
  const departureCity = params?.departureCity || '';
  const transportMode = params?.transportMode || 'flight';
  
  // Build a detailed prompt for unique daily plans
  const prompt = `You are an expert travel planner creating a UNIQUE and DETAILED ${days}-day itinerary for ${destination}${departureCity ? ` (departing from ${departureCity} by ${transportMode})` : ''}.

CRITICAL REQUIREMENTS:
1. Each day MUST have DIFFERENT activities - no repetition!
2. Use REAL, SPECIFIC place names (e.g., "Tsukiji Outer Market" not "Local Market")
3. Include FAMOUS restaurants with actual names (e.g., "Ichiran Ramen Shibuya")
4. Times must be realistic (09:00, 12:30, etc.) in HH:MM format
5. Day 0 should include arrival transport if departing from ${departureCity || 'home'}
6. Last day (Day ${days - 1}) should include departure transport

VARIETY RULES:
- Morning (09:00-12:00): Mix of temples, markets, museums, parks
- Lunch (12:00-14:00): Different cuisine each day (local, seafood, street food, fine dining)
- Afternoon (14:00-18:00): Shopping, cultural experiences, neighborhoods
- Evening (18:00-21:00): Different dinner spots, entertainment, night views

Return ONLY a valid JSON array. Each item:
{"dayIndex": 0-${days - 1}, "time": "HH:MM", "location": "Exact Place Name", "note": "What to do/eat/see", "type": "activity|transport", "transportMode": "flight|train|taxi" (if transport), "origin": "from where" (if transport), "endTime": "HH:MM" (if transport)}

Generate 4-6 unique activities per day. No generic names!`;

  try {
    const text = await callAI(prompt, 3000);
    
    if (!text) {
      console.warn('All AI providers failed, using fallback itinerary');
      return generateFallbackItinerary(destination, days, departureCity);
    }

    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = text;
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    } else {
      const arrayMatch = text.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        jsonStr = arrayMatch[0];
      }
    }

    try {
      const itinerary = JSON.parse(jsonStr);
      
      if (!Array.isArray(itinerary) || itinerary.length === 0) {
        console.warn('Invalid AI response structure, using fallback');
        return generateFallbackItinerary(destination, days, departureCity);
      }

      // Validate and clean each item
      return itinerary.map((item: any, idx: number) => ({
        dayIndex: typeof item.dayIndex === 'number' ? item.dayIndex : Math.floor(idx / 4),
        time: item.time || '12:00',
        location: item.location || `${destination} Location ${idx + 1}`,
        note: item.note || 'Explore the area',
        type: item.type || 'activity',
        transportMode: item.transportMode,
        origin: item.origin,
        endTime: item.endTime,
      }));
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Raw text:', text.substring(0, 500));
      return generateFallbackItinerary(destination, days, departureCity);
    }
  } catch (e) {
    console.error('AI itinerary generation failed:', e);
    return generateFallbackItinerary(destination, days, departureCity);
  }
};

// ===== Tripadvisor Content API =====
// Free tier: 5000 calls/month
// Get your API key at: https://www.tripadvisor.com/developers
const TRIPADVISOR_API_KEY = import.meta.env.VITE_TRIPADVISOR_API_KEY || '';

export interface TripAdvisorLocation {
  location_id: string;
  name: string;
  address_obj?: {
    street1?: string;
    city?: string;
    country?: string;
  };
  rating?: string;
  num_reviews?: string;
  photo?: {
    images?: {
      small?: { url: string };
      medium?: { url: string };
    };
  };
  category?: {
    name: string;
  };
  subcategory?: Array<{ name: string }>;
  web_url?: string;
}

// Search for locations/POIs using Tripadvisor
export const searchTripadvisorLocations = async (
  query: string,
  category?: 'attractions' | 'restaurants' | 'hotels'
): Promise<TripAdvisorLocation[]> => {
  if (!TRIPADVISOR_API_KEY) {
    console.warn('Tripadvisor API key not configured');
    return [];
  }

  try {
    const categoryParam = category ? `&category=${category}` : '';
    const response = await safeFetch(
      `https://api.content.tripadvisor.com/api/v1/location/search?key=${TRIPADVISOR_API_KEY}&searchQuery=${encodeURIComponent(query)}${categoryParam}&language=en`,
      5000
    );

    if (!response.ok) {
      console.warn('Tripadvisor API error:', response.status);
      return [];
    }

    const data = await response.json();
    return data.data || [];
  } catch (e) {
    console.warn('Tripadvisor search failed:', e);
    return [];
  }
};

// Get location details from Tripadvisor
export const getTripadvisorLocationDetails = async (locationId: string): Promise<TripAdvisorLocation | null> => {
  if (!TRIPADVISOR_API_KEY) {
    return null;
  }

  try {
    const response = await safeFetch(
      `https://api.content.tripadvisor.com/api/v1/location/${locationId}/details?key=${TRIPADVISOR_API_KEY}&language=en`,
      5000
    );

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (e) {
    console.warn('Tripadvisor details failed:', e);
    return null;
  }
};

// Get nearby attractions from Tripadvisor
export const getNearbyAttractions = async (lat: number, lon: number): Promise<TripAdvisorLocation[]> => {
  if (!TRIPADVISOR_API_KEY) {
    return [];
  }

  try {
    const response = await safeFetch(
      `https://api.content.tripadvisor.com/api/v1/location/nearby_search?key=${TRIPADVISOR_API_KEY}&latLong=${lat},${lon}&category=attractions&language=en`,
      5000
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.data || [];
  } catch (e) {
    console.warn('Tripadvisor nearby search failed:', e);
    return [];
  }
};

// Fallback recommendations for when API is unavailable
const generateFallbackRecommendations = (location: string): string => {
  return `Here are some suggestions for ${location}:\n\n1. **Local Street Food**: Try the traditional street vendors and night markets\n2. **Historical Temples/Shrines**: Visit historic religious sites and cultural landmarks\n3. **Modern Shopping Districts**: Explore contemporary shopping areas and local boutiques\n\nTip: Ask locals for the best hidden gems - they often know the best spots!`;
};

export const askAI = async (location: string): Promise<string> => {
  const prompt = `Suggest 3 specific hidden gem restaurants or unique activities near ${location}. 
Include:
- Exact place names (not generic descriptions)
- What makes each special
- Best time to visit
Keep each suggestion to 2-3 sentences. Format as a numbered list.`;

  try {
    const text = await callAI(prompt, 500);
    
    if (!text || text.length < 20) {
      console.warn('AI recommendation failed, using fallback');
      return generateFallbackRecommendations(location);
    }
    
    return text;
  } catch (e) {
    console.warn('AI recommendations failed:', e);
    return generateFallbackRecommendations(location);
  }
};

// ===== Flight Info API =====
// Using AviationStack API (free tier: 100 requests/month)
// Get your free API key at: https://aviationstack.com/
const AVIATION_API_KEY = import.meta.env.VITE_AVIATION_API_KEY || '';

export interface FlightInfo {
  airline: string;
  flightNumber: string;
  departure: {
    airport: string;
    iata: string;
    scheduled: string;
    estimated?: string;
    actual?: string;
    terminal?: string;
    gate?: string;
  };
  arrival: {
    airport: string;
    iata: string;
    scheduled: string;
    estimated?: string;
    actual?: string;
    terminal?: string;
    gate?: string;
  };
  status: string;
  duration?: string;
}

export const lookupFlightInfo = async (flightNumber: string, date?: string): Promise<FlightInfo | null> => {
  try {
    // Clean up flight number (remove spaces, uppercase)
    const cleanFlightNum = flightNumber.replace(/\s+/g, '').toUpperCase();
    
    if (!AVIATION_API_KEY) {
      console.warn('No AVIATION_API_KEY configured. Get your free key at https://aviationstack.com/');
      // Return mock data for demo purposes
      return generateMockFlightInfo(cleanFlightNum);
    }

    const params = new URLSearchParams({
      access_key: AVIATION_API_KEY,
      flight_iata: cleanFlightNum,
    });
    
    if (date) {
      params.append('flight_date', date);
    }

    const response = await safeFetch(
      `http://api.aviationstack.com/v1/flights?${params.toString()}`,
      10000
    );

    if (!response.ok) {
      console.error('AviationStack API error:', response.status);
      return generateMockFlightInfo(cleanFlightNum);
    }

    const data = await response.json();
    
    if (!data.data || data.data.length === 0) {
      console.warn('No flight found for', cleanFlightNum);
      return generateMockFlightInfo(cleanFlightNum);
    }

    const flight = data.data[0];
    
    // Calculate duration
    let duration = '';
    if (flight.departure?.scheduled && flight.arrival?.scheduled) {
      const dep = new Date(flight.departure.scheduled);
      const arr = new Date(flight.arrival.scheduled);
      const diffMs = arr.getTime() - dep.getTime();
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      duration = `${diffHrs}h ${diffMins}m`;
    }

    return {
      airline: flight.airline?.name || 'Unknown Airline',
      flightNumber: cleanFlightNum,
      departure: {
        airport: flight.departure?.airport || 'Unknown',
        iata: flight.departure?.iata || '',
        scheduled: flight.departure?.scheduled || '',
        estimated: flight.departure?.estimated,
        actual: flight.departure?.actual,
        terminal: flight.departure?.terminal,
        gate: flight.departure?.gate,
      },
      arrival: {
        airport: flight.arrival?.airport || 'Unknown',
        iata: flight.arrival?.iata || '',
        scheduled: flight.arrival?.scheduled || '',
        estimated: flight.arrival?.estimated,
        actual: flight.arrival?.actual,
        terminal: flight.arrival?.terminal,
        gate: flight.arrival?.gate,
      },
      status: flight.flight_status || 'scheduled',
      duration,
    };
  } catch (e) {
    console.error('Flight lookup failed:', e);
    return generateMockFlightInfo(flightNumber);
  }
};

// Airline code to name mapping for display
const AIRLINE_CODES: Record<string, { name: string; hub: string }> = {
  'CX': { name: 'Cathay Pacific', hub: 'HKG' },
  'UO': { name: 'HK Express', hub: 'HKG' },
  'HX': { name: 'Hong Kong Airlines', hub: 'HKG' },
  'BR': { name: 'EVA Air', hub: 'TPE' },
  'CI': { name: 'China Airlines', hub: 'TPE' },
  'SQ': { name: 'Singapore Airlines', hub: 'SIN' },
  'JL': { name: 'Japan Airlines', hub: 'NRT' },
  'NH': { name: 'ANA', hub: 'NRT' },
  'KE': { name: 'Korean Air', hub: 'ICN' },
  'OZ': { name: 'Asiana Airlines', hub: 'ICN' },
  'TG': { name: 'Thai Airways', hub: 'BKK' },
  'MH': { name: 'Malaysia Airlines', hub: 'KUL' },
  'AA': { name: 'American Airlines', hub: 'DFW' },
  'UA': { name: 'United Airlines', hub: 'ORD' },
  'DL': { name: 'Delta Air Lines', hub: 'ATL' },
  'BA': { name: 'British Airways', hub: 'LHR' },
  'EK': { name: 'Emirates', hub: 'DXB' },
  'QF': { name: 'Qantas', hub: 'SYD' },
  'CA': { name: 'Air China', hub: 'PEK' },
  'MU': { name: 'China Eastern', hub: 'PVG' },
  'CZ': { name: 'China Southern', hub: 'CAN' },
  'TR': { name: 'Scoot', hub: 'SIN' },
  'AK': { name: 'AirAsia', hub: 'KUL' },
  'VN': { name: 'Vietnam Airlines', hub: 'SGN' },
  'PR': { name: 'Philippine Airlines', hub: 'MNL' },
};

// Get airline info from flight number (for display purposes only)
export const getAirlineFromCode = (flightNumber: string): { name: string; hub: string } | null => {
  const code = flightNumber.replace(/\s+/g, '').substring(0, 2).toUpperCase();
  return AIRLINE_CODES[code] || null;
};

// Generate mock flight data for demo/testing when API is unavailable
// NOTE: This is DEMO DATA only - real-time flight APIs require paid subscriptions
const generateMockFlightInfo = (flightNumber: string): FlightInfo | null => {
  // Extract airline code (first 2 letters)
  const airlineCode = flightNumber.replace(/\s+/g, '').substring(0, 2).toUpperCase();
  const airlineInfo = AIRLINE_CODES[airlineCode];
  
  // If unknown airline code, return null instead of fake data
  if (!airlineInfo) {
    return null;
  }

  const now = new Date();
  const depTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const arrTime = new Date(depTime.getTime() + 3 * 60 * 60 * 1000);

  return {
    airline: airlineInfo.name,
    flightNumber: flightNumber.toUpperCase(),
    departure: {
      airport: `Demo: Check airline website for real info`,
      iata: '---',
      scheduled: depTime.toISOString(),
      terminal: '-',
      gate: '-',
    },
    arrival: {
      airport: `Demo: Check airline website for real info`,
      iata: '---',
      scheduled: arrTime.toISOString(),
      terminal: '-',
    },
    status: 'demo-only',
    duration: '~3h',
  };
};

