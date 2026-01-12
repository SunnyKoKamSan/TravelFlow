export interface TripSettings {
  isSetup: boolean;
  destination: string;
  startDate: string;
  days: number;
  users: string[];
  currencyCode: string;
  currencySymbol: string;
  targetLang: string;
  langName: string;
}

export interface ItineraryItem {
  id: number;
  dayIndex: number;
  time: string;
  location: string;
  note?: string;
  lat?: number;
  lon?: number;
  weather?: WeatherData;
}

export interface WeatherData {
  temp: number;
  code: number;
}

export interface Expense {
  id: number;
  amount: number;
  title: string;
  payer: string;
}

export interface Trip {
  settings: TripSettings;
  itinerary: ItineraryItem[];
  expenses: Expense[];
  lastModified?: number;
}

export interface AllTrips {
  [tripId: string]: Trip;
}

export interface GeocodeResult {
  name: string;
  latitude: number;
  longitude: number;
  country_code?: string;
  country?: string;
  admin1?: string;
  currencySymbol?: string;
  langName?: string;
}

export interface WizardState {
  step: number;
  destination: string;
  date: string;
  loading: boolean;
  currencyCode: string;
  tempData: GeocodeResult | null;
  isSearching: boolean;
  suggestions: GeocodeResult[];
}

export interface User {
  uid: string;
  email?: string | null;
  photoURL?: string | null;
  isAnonymous?: boolean;
}

export type ViewState = 'loading' | 'login' | 'wizard' | 'app';
export type TabId = 'itinerary' | 'wallet' | 'map';
export type SyncStatus = 'offline' | 'syncing' | 'online';
