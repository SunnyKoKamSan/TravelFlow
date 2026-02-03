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

