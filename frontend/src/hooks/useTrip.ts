import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Trip, TripSettings, AllTrips, ItineraryItem, Expense } from '@/types';
import { getCoordinates, fetchWeather } from '@/lib/api';

const defaultSettings: TripSettings = {
  isSetup: false,
  destination: '',
  departureCity: '',
  departureCurrencyCode: 'USD',
  departureCurrencySymbol: '$',
  startDate: '',
  endDate: '',
  days: 3,
  users: ['Me', 'Partner'],
  currencyCode: 'USD',
  currencySymbol: '$',
  targetLang: 'en',
  langName: 'English',
  autoUpdateRate: true,
};

export function useTrip(userId: string | null) {
  const [allTrips, setAllTrips] = useState<AllTrips>({});
  const [currentTripId, setCurrentTripId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'offline' | 'syncing' | 'online'>('offline');
  const [settings, setSettings] = useState<TripSettings>(defaultSettings);
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Load trip data
  const loadTrip = useCallback((tripId: string) => {
    const trip = allTrips[tripId];
    if (!trip) return;

    setSettings({ ...trip.settings });
    setItinerary([...trip.itinerary]);
    setExpenses([...trip.expenses]);
  }, [allTrips]);

  const saveData = useCallback(async (
    overrideSettings?: TripSettings,
    overrideItinerary?: ItineraryItem[],
    overrideExpenses?: Expense[]
  ) => {
    if (!currentTripId) return;

    const dataToSave = {
      settings: overrideSettings ?? settings,
      itinerary: overrideItinerary ?? itinerary,
      expenses: overrideExpenses ?? expenses,
      lastModified: Date.now(),
    };

    const updatedTrips = {
      ...allTrips,
      [currentTripId]: dataToSave,
    };

    setAllTrips(updatedTrips);

    const data = {
      trips: updatedTrips,
      currentTripId,
      lastModified: Date.now(),
    };

    if (userId === 'guest') {
      sessionStorage.setItem('travelFlowData_guest', JSON.stringify(data));
      setSyncStatus('offline (guest)' as any);
      return;
    }

    if (userId && db) {
      try {
        await setDoc(doc(db, 'users', userId), data);
        setSyncStatus('online');
      } catch (e) {
        setSyncStatus('offline');
      }
    }
  }, [currentTripId, allTrips, settings, itinerary, expenses, userId]);

  useEffect(() => {
    setAllTrips({});
    setCurrentTripId(null);
    setSettings(defaultSettings);
    setItinerary([]);
    setExpenses([]);
    setSyncStatus('offline');

    if (!userId || userId === 'guest') {
      const saved = sessionStorage.getItem('travelFlowData_guest');
      if (saved) {
        const data = JSON.parse(saved);
        if (data.trips) {
          setAllTrips(data.trips);
          if (data.currentTripId && data.trips[data.currentTripId]) {
            setCurrentTripId(data.currentTripId);
            const trip = data.trips[data.currentTripId];
            setSettings({ ...trip.settings });
            setItinerary([...trip.itinerary]);
            setExpenses([...trip.expenses]);
          }
        }
      }
      return;
    }

    setSyncStatus('syncing');
    const unsubscribe = onSnapshot(doc(db, 'users', userId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.trips) {
          setAllTrips(data.trips);
          if (data.currentTripId && data.trips[data.currentTripId]) {
            setCurrentTripId(data.currentTripId);
            const trip = data.trips[data.currentTripId];
            setSettings({ ...trip.settings });
            setItinerary([...trip.itinerary]);
            setExpenses([...trip.expenses]);
          } else if (Object.keys(data.trips).length > 0) {
            const firstId = Object.keys(data.trips)[0];
            setCurrentTripId(firstId);
            const trip = data.trips[firstId];
          if (trip) {
            setSettings({ ...trip.settings });
            setItinerary([...trip.itinerary]);
            setExpenses([...trip.expenses]);
          }
          }
        } else if (data.settings?.isSetup) {
          // Migrate legacy data
          const legacyId = 'legacy_' + Date.now();
          const migratedTrip: Trip = {
            settings: data.settings,
            itinerary: data.itinerary || [],
            expenses: data.expenses || [],
          };
          setAllTrips({ [legacyId]: migratedTrip });
          setCurrentTripId(legacyId);
          setSettings({ ...migratedTrip.settings });
          setItinerary([...migratedTrip.itinerary]);
          setExpenses([...migratedTrip.expenses]);
          
          // Save migrated data
          setDoc(doc(db, 'users', userId), {
            trips: { [legacyId]: migratedTrip },
            currentTripId: legacyId,
            lastModified: Date.now(),
          });
        }
        setSyncStatus('online');
      } else {
        setSyncStatus('online');
      }
    });

    return () => unsubscribe();
  }, [userId]);

  // Create new trip
  const createNewTrip = useCallback(() => {
    setSettings(defaultSettings);
    setItinerary([]);
    setExpenses([]);
    setCurrentTripId(null);
  }, []);

  // Switch trip
  const switchTrip = useCallback((tripId: string) => {
    setCurrentTripId(tripId);
    loadTrip(tripId);
  }, [loadTrip]);

  // Delete trip
  const deleteTrip = useCallback((tripId: string) => {
    const updated = { ...allTrips };
    delete updated[tripId];
    setAllTrips(updated);

    if (currentTripId === tripId) {
      const remainingIds = Object.keys(updated);
      if (remainingIds.length > 0) {
        switchTrip(remainingIds[0]);
      } else {
        createNewTrip();
      }
    } else {
      saveData();
    }
  }, [allTrips, currentTripId, switchTrip, createNewTrip, saveData]);

  // Add itinerary item
  const addItineraryItem = useCallback(async (item: Omit<ItineraryItem, 'id' | 'lat' | 'lon' | 'weather'>) => {
    const coords = await getCoordinates(item.location);
    const weather = coords.lat ? await fetchWeather(coords.lat, coords.lon) : undefined;
    const newItem: ItineraryItem = {
      ...item,
      id: Date.now(),
      lat: coords.lat,
      lon: coords.lon,
      weather,
    };
    const newItinerary = [...itinerary, newItem];
    setItinerary(newItinerary);
    await saveData(undefined, newItinerary, undefined);
  }, [itinerary, saveData]);

  // Update itinerary item
  const updateItineraryItem = useCallback(async (item: ItineraryItem) => {
    const coords = item.lat && item.lon ? { lat: item.lat, lon: item.lon } : await getCoordinates(item.location);
    const weather = coords.lat ? await fetchWeather(coords.lat, coords.lon) : item.weather;
    
    const newItinerary = itinerary.map((i) => (i.id === item.id ? { ...item, lat: coords.lat, lon: coords.lon, weather } : i));
    setItinerary(newItinerary);
    await saveData(undefined, newItinerary, undefined);
  }, [itinerary, saveData]);

  // Delete itinerary item
  const deleteItineraryItem = useCallback((id: number) => {
    const newItinerary = itinerary.filter((i) => i.id !== id);
    setItinerary(newItinerary);
    saveData(undefined, newItinerary, undefined);
  }, [itinerary, saveData]);

  // Add expense
  const addExpense = useCallback((expense: Omit<Expense, 'id'>) => {
    const newExpense: Expense = {
      ...expense,
      id: Date.now(),
    };
    const newExpenses = [newExpense, ...expenses];
    setExpenses(newExpenses);
    saveData(undefined, undefined, newExpenses);
  }, [expenses, saveData]);

  // Delete expense
  const deleteExpense = useCallback((id: number) => {
    const newExpenses = expenses.filter((e) => e.id !== id);
    setExpenses(newExpenses);
    saveData(undefined, undefined, newExpenses);
  }, [expenses, saveData]);

  // Update settings
  const updateSettings = useCallback((newSettings: Partial<TripSettings>) => {
    const newSettings2 = { ...settings, ...newSettings };
    setSettings(newSettings2);
    saveData(newSettings2, undefined, undefined);
  }, [settings, saveData]);

  return {
    allTrips,
    currentTripId,
    setCurrentTripId,
    syncStatus,
    settings,
    itinerary,
    expenses,
    setSettings,
    setItinerary,
    setExpenses,
    loadTrip,
    saveData,
    createNewTrip,
    switchTrip,
    deleteTrip,
    addItineraryItem,
    updateItineraryItem,
    deleteItineraryItem,
    addExpense,
    deleteExpense,
    updateSettings,
  };
}
