import { useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import Globe from './Globe';
import {
  searchLocation,
  getCoordinates,
  fetchWeather,
  getCountryInfo,
  fetchExchangeRate,
  generateAIItinerary,
} from '../lib/api';
import { GeocodeResult } from '../types';

interface WizardProps {
  setSettings: Dispatch<SetStateAction<any>>;
  setItinerary: Dispatch<SetStateAction<any[]>>;
  setExpenses: Dispatch<SetStateAction<any[]>>;
  saveData: () => Promise<void>;
  setCurrentTripId: Dispatch<SetStateAction<string | null>>;
  setViewState: (v: 'loading' | 'login' | 'wizard' | 'app') => void;
  allTrips: Record<string, any>;
  switchTrip: (id: string) => void;
  currentTripId: string | null;
}

export default function Wizard({ setSettings, setItinerary, setExpenses, saveData, setCurrentTripId, setViewState, allTrips, switchTrip, currentTripId }: WizardProps) {
  const [wizard, setWizard] = useState({
    step: 1,
    destination: '',
    date: '',
    loading: false,
    currencyCode: '',
    tempData: null as GeocodeResult | null,
    isSearching: false,
    suggestions: [] as GeocodeResult[],
  });

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (wizard.destination.length < 2) {
      setWizard(prev => ({ ...prev, suggestions: [] }));
      return;
    }
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    setWizard(prev => ({ ...prev, isSearching: true }));
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchLocation(wizard.destination);
        setWizard(prev => ({ ...prev, suggestions: results, isSearching: false }));
      } catch (e) {
        console.error(e);
        setWizard(prev => ({ ...prev, isSearching: false }));
      }
    }, 300);
  }, [wizard.destination]);

  const onDestinationInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWizard(prev => ({ ...prev, destination: e.target.value, tempData: null }));
  };

  const selectSuggestion = (item: GeocodeResult) => {
    setWizard(prev => ({
      ...prev,
      destination: item.name,
      suggestions: [],
      tempData: {
        name: item.name,
        latitude: item.latitude,
        longitude: item.longitude,
        country_code: item.country_code,
        country: item.country,
        admin1: item.admin1,
      },
    }));
  };

  const detectDetails = async () => {
    if (!wizard.tempData) {
      if (wizard.suggestions.length > 0) {
        selectSuggestion(wizard.suggestions[0]);
        return;
      } else {
        alert('Please select a valid destination from the list.');
        return;
      }
    }

    if (!wizard.destination || !wizard.date) {
      alert('Please fill in all fields');
      return;
    }

    setWizard(prev => ({ ...prev, loading: true }));
    let temp = { ...wizard.tempData, currencySymbol: '$', langName: 'English' } as any;
    let currCode = 'USD';

    try {
      if (temp.country_code) {
        try {
          const countryInfo = await getCountryInfo(temp.country_code);
          if (countryInfo) {
            currCode = countryInfo.currencyCode;
            temp = { ...temp, currencySymbol: countryInfo.currencySymbol, langName: countryInfo.langName };
          }
        } catch (err) {
          console.log('Country API failed, using defaults');
        }
      }
    } catch (e) {
      console.log('Location API failed, using defaults');
    }

    setWizard(prev => ({
      ...prev,
      currencyCode: currCode,
      tempData: temp,
      loading: false,
      step: 2,
    }));
  };

  const handleGenerateAIItinerary = async () => {
    if (!wizard.destination) {
      alert('Please enter a destination first.');
      return;
    }

    setWizard(prev => ({ ...prev, loading: true }));
    try {
      const aiItinerary = await generateAIItinerary(wizard.destination);

      const newTripId = 'trip_' + Date.now();
      setCurrentTripId(newTripId);

      const newSettings = {
        isSetup: true,
        destination: wizard.destination,
        startDate: wizard.date || new Date().toISOString().split('T')[0],
        days: 3,
        users: ['Me'],
        currencyCode: 'USD',
        currencySymbol: '$',
        targetLang: 'en',
        langName: 'English',
      };

      setSettings(newSettings);

      const newItinerary = aiItinerary.map((item: any, index: number) => ({
        id: Date.now() + index,
        dayIndex: item.dayIndex || 0,
        time: item.time || '12:00',
        location: item.location,
        note: item.note,
        lat: 0,
        lon: 0,
      }));

      setItinerary(newItinerary);
      setExpenses([]);

      await saveData();
      setViewState('app');

      for (const item of newItinerary) {
        try {
          const coords = await getCoordinates(item.location);
          setItinerary((prev: any[]) => prev.map((i: any) =>
            i.id === item.id ? { ...i, lat: coords.lat, lon: coords.lon } : i
          ));
        } catch (e) {
          console.warn('Failed to get coordinates for AI itinerary item', e);
        }
      }
      await saveData();
    } catch (e) {
      console.error('AI Generation Failed', e);
      alert('AI service unavailable or blocked. Creating a basic plan instead.');
      await handleFinishManual();
    } finally {
      setWizard(prev => ({ ...prev, loading: false }));
    }
  };

  const handleFinishManual = async () => {
    const info = wizard.tempData as any;
    if (!info) return;

    const langMap: Record<string, string> = {
      'Japanese': 'ja',
      'English': 'en',
      'French': 'fr',
      'German': 'de',
      'Spanish': 'es',
      'Italian': 'it',
      'Chinese': 'zh',
    };
    const targetLang = langMap[info.langName || ''] || info.country_code || 'en';

    const newTripId = 'trip_' + Date.now();
    setCurrentTripId(newTripId);

    const newSettings = {
      isSetup: true,
      destination: wizard.destination,
      startDate: wizard.date,
      days: 3,
      users: ['Me', 'Partner'],
      currencyCode: (wizard.currencyCode || 'USD').toUpperCase(),
      currencySymbol: info.currencySymbol || '$',
      targetLang: targetLang,
      langName: info.langName || 'English',
    };

    setSettings(newSettings);

    let startLoc;
    if (info.latitude && info.longitude) {
      startLoc = [{
        id: Date.now(),
        dayIndex: 0,
        time: '10:00',
        location: wizard.destination + ' (Arrival)',
        note: 'Flight Arrival',
        lat: info.latitude,
        lon: info.longitude,
      }];
    } else {
      startLoc = [{
        id: Date.now(),
        dayIndex: 0,
        time: '10:00',
        location: 'Arrival',
        note: 'Flight Arrival',
        lat: 0,
        lon: 0,
      }];
    }

    setItinerary(startLoc);
    setExpenses([]);

    try {
      await fetchExchangeRate(newSettings.currencyCode);
    } catch (e) {
      console.warn('Exchange rate fetch failed', e);
    }
    await saveData();
    setViewState('app');

    if (info.latitude && info.longitude) {
      const weather = await fetchWeather(info.latitude, info.longitude);
      if (weather) {
        setItinerary((prev: any[]) => prev.map((i: any) => i.id === startLoc[0].id ? { ...i, weather } : i));
        await saveData();
      }
    }
  };

  const cancelWizard = () => {
    if (Object.keys(allTrips).length > 0) {
      const ids = Object.keys(allTrips);
      switchTrip(currentTripId || ids[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 text-center overflow-y-auto custom-scroll">
      <div className="absolute inset-0 bg-white/40 backdrop-blur-xl z-0"></div>

      {Object.keys(allTrips).length > 0 && (
        <button
          onClick={cancelWizard}
          className="absolute top-10 left-6 z-20 w-12 h-12 rounded-full glass-panel flex items-center justify-center text-stone-600 hover:text-stone-800 transition-colors"
        >
          <i className="ph ph-arrow-left text-xl"></i>
        </button>
      )}

      <div className="relative z-10 w-full max-w-4xl flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">
        <div className="order-1 md:order-2 flex flex-col items-center">
          <div id="wizard-globe-wrapper" className="w-[250px] h-[250px] rounded-full overflow-hidden bg-transparent">
            <Globe
              width={250}
              height={250}
              destination={wizard.tempData ? {
                lat: (wizard.tempData as any).latitude,
                lon: (wizard.tempData as any).longitude,
                name: wizard.destination,
              } : null}
              isMini={true}
            />
          </div>
          <div className="mt-4 text-stone-500 font-bold text-sm tracking-wide uppercase opacity-70">
            Preview Destination
          </div>
        </div>

        <div className="w-full md:w-1/2 max-w-md order-2 md:order-1">
          {wizard.step === 1 && (
            <div className="space-y-8">
              <div>
                <h1 className="text-5xl font-bold text-stone-800 tracking-tight mb-2">Plan Trip</h1>
                <p className="text-stone-500 font-medium">Where is your next adventure?</p>
              </div>

              <div className="glass-panel p-8 rounded-[40px] text-left space-y-6 shadow-xl relative">
                <div className="relative">
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2 ml-1">Destination</label>
                  <input
                    value={wizard.destination}
                    onChange={onDestinationInput}
                    type="text"
                    placeholder="e.g. Tokyo"
                    autoComplete="off"
                    className="w-full bg-white/60 border border-white/80 rounded-2xl px-5 py-4 text-xl font-bold text-stone-800 outline-none focus:ring-2 focus:ring-orange-300/50 transition-all font-num relative z-20"
                  />

                  {wizard.suggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-2 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 z-50 overflow-hidden max-h-60 overflow-y-auto divide-y divide-stone-100">
                      {wizard.suggestions.map((item, index) => (
                        <div
                          key={index}
                          onClick={() => selectSuggestion(item)}
                          className="px-5 py-3 hover:bg-orange-50 cursor-pointer transition-colors flex items-center gap-3"
                        >
                          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 shrink-0">
                            <i className="ph ph-airplane-tilt"></i>
                          </div>
                          <div className="text-left overflow-hidden">
                            <div className="text-sm font-bold text-stone-800 truncate">{item.name}</div>
                            <div className="text-xs text-stone-500 truncate">{[item.admin1, item.country].filter(Boolean).join(', ')}</div>
                          </div>
                          {item.country_code && (
                            <div className="ml-auto text-xs font-bold text-stone-300 uppercase">{item.country_code}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2 ml-1">Start Date</label>
                  <input
                    value={wizard.date}
                    onChange={(e) => setWizard(prev => ({ ...prev, date: e.target.value }))}
                    type="date"
                    className="w-full bg-white/60 border border-white/80 rounded-2xl px-5 py-4 text-lg font-medium text-stone-800 outline-none focus:ring-2 focus:ring-orange-300/50 transition-all font-num"
                  />
                </div>
                <button
                  onClick={detectDetails}
                  disabled={wizard.loading}
                  className="w-full bg-stone-800 text-amber-50 py-5 rounded-2xl font-bold text-lg hover:bg-stone-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                >
                  {wizard.loading ? (
                    <><i className="ph ph-spinner animate-spin"></i> Analyzing...</>
                  ) : (
                    <>
                      Next <i className="ph ph-arrow-right"></i>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {wizard.step === 2 && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-stone-800">Confirm Details</h2>
              <div className="glass-panel p-6 rounded-[32px] text-left space-y-5 shadow-xl">
                <div className="flex items-center gap-4 p-4 bg-white/60 rounded-2xl border border-white/50">
                  <div className="w-12 h-12 bg-blue-100/50 rounded-full flex items-center justify-center text-blue-600 shrink-0">
                    <i className="ph ph-map-pin text-xl"></i>
                  </div>
                  <div>
                    <div className="text-[10px] text-stone-400 uppercase font-bold tracking-widest">Destination</div>
                    <div className="text-xl font-bold text-stone-800 truncate max-w-[200px]">{wizard.destination}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-white/60 rounded-2xl border border-white/50">
                  <div className="w-12 h-12 bg-green-100/50 rounded-full flex items-center justify-center text-green-600 shrink-0">
                    <i className="ph ph-currency-circle-dollar text-xl"></i>
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] text-stone-400 uppercase font-bold tracking-widest">Currency</div>
                    <input
                      value={wizard.currencyCode}
                      onChange={(e) => setWizard(prev => ({ ...prev, currencyCode: e.target.value }))}
                      className="w-full bg-transparent border-b border-stone-300 font-bold text-xl text-stone-800 outline-none focus:border-orange-400 py-1 font-num"
                      type="text"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setWizard(prev => ({ ...prev, step: 1 }))}
                    className="flex-1 py-4 text-stone-500 font-bold hover:text-stone-800 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleGenerateAIItinerary}
                    className="flex-[2] bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <i className="ph ph-sparkle"></i> AI Generate Trip
                  </button>
                  <button
                    onClick={handleFinishManual}
                    className="flex-[2] bg-stone-800 text-amber-50 py-4 rounded-2xl font-bold shadow-lg hover:bg-stone-700 active:scale-[0.98] transition-all"
                  >
                    Manual Start
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
