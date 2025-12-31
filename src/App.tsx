import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from './hooks/useAuth';
import { useTrip } from './hooks/useTrip';
import { useDebounce } from './hooks/useDebounce';
import Globe from './components/Globe';
import Header from './components/Header';
import NavBar from './components/NavBar';
import FAB from './components/FAB';
import MapPanel from './components/MapPanel';
import { 
  searchLocation, 
  getCoordinates, 
  fetchWeather, 
  getWeatherIcon, 
  getCountryInfo, 
  fetchExchangeRate, 
  translateText, 
  generateAIItinerary, 
  askAI 
} from './lib/api';
import { formatDate } from './lib/utils';
import { ItineraryItem, GeocodeResult, TripSettings } from './types';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const defaultSettings: TripSettings = {
  isSetup: false,
  destination: '',
  startDate: '',
  days: 3,
  users: ['Me', 'Partner'],
  currencyCode: 'USD',
  currencySymbol: '$',
  targetLang: 'en',
  langName: 'English',
};

function App() {
  const { user, loading: authLoading, loginGoogle, loginAnonymously, logout } = useAuth();
  const userId = user?.uid || null;
  
  const {
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
    saveData,
    createNewTrip: tripCreateNewTrip,
    switchTrip,
    deleteTrip,
    addItineraryItem,
    updateItineraryItem,
    deleteItineraryItem,
    addExpense,
    deleteExpense,
    updateSettings,
  } = useTrip(userId);

  const [viewState, setViewState] = useState<'loading' | 'login' | 'wizard' | 'app'>('loading');
  const [activeTab, setActiveTab] = useState<'itinerary' | 'wallet' | 'map'>('itinerary');
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [realTimeRate, setRealTimeRate] = useState(1);
  const [mapReady, setMapReady] = useState(false);
  
  // Modals
  const [showItineraryModal, setShowItineraryModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTranslator, setShowTranslator] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showGlobeModal, setShowGlobeModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Wizard
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
  
  // Forms
  const [formItinerary, setFormItinerary] = useState({ id: null as number | null, time: '', location: '', note: '' });
  const [formExpense, setFormExpense] = useState({ amount: '', title: '', payer: 'Me' });
  const [tempUsersString, setTempUsersString] = useState('');
  
  // Translator
  const [transInput, setTransInput] = useState('');
  const [transResult, setTransResult] = useState('');
  const [transLoading, setTransLoading] = useState(false);
  
  // AI
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  
  // Globe/Map refs
  const [activeItemForGlobe, setActiveItemForGlobe] = useState<ItineraryItem | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const modalMapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const modalMarkerRef = useRef<L.Marker | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const tabs = [
    { id: 'itinerary' as const, label: 'Plan', icon: 'ph-calendar-blank', iconFill: 'ph-calendar-check-fill' },
    { id: 'wallet' as const, label: 'Wallet', icon: 'ph-wallet', iconFill: 'ph-wallet-fill' },
    { id: 'map' as const, label: 'Map', icon: 'ph-map-trifold', iconFill: 'ph-map-trifold-fill' },
  ];

  // Computed
  const filteredItinerary = useMemo(() => 
    itinerary.filter(i => i.dayIndex === currentDayIndex).sort((a, b) => a.time.localeCompare(b.time)),
    [itinerary, currentDayIndex]
  );

  const totalExpense = useMemo(() => 
    expenses.reduce((s, i) => s + i.amount, 0),
    [expenses]
  );

  const balances = useMemo(() => {
    const r: Record<string, number> = {};
    settings.users.forEach(u => r[u] = 0);
    const pp = totalExpense / settings.users.length;
    expenses.forEach(e => {
      if (r[e.payer] !== undefined) r[e.payer] += e.amount;
    });
    Object.keys(r).forEach(u => r[u] = Math.round(r[u] - pp));
    return r;
  }, [expenses, settings.users, totalExpense]);

  // Initialize view state
  useEffect(() => {
    if (authLoading) {
      setViewState('loading');
      return;
    }

    if (!user) {
      setViewState('login');
    } else if (!settings.isSetup) {
      setViewState('wizard');
    } else {
      setViewState('app');
    }
  }, [user, authLoading, settings.isSetup]);

  // Initialize temp users string
  useEffect(() => {
    setTempUsersString(settings.users.join(', '));
  }, [settings.users]);

  // Fetch exchange rate
  useEffect(() => {
    if (settings.currencyCode) {
      fetchExchangeRate(settings.currencyCode).then(rate => setRealTimeRate(rate));
    }
  }, [settings.currencyCode]);

  // Wizard destination input with debounce
  const debouncedDestination = useDebounce(wizard.destination, 300);

  useEffect(() => {
    if (debouncedDestination.length < 2) {
      setWizard(prev => ({ ...prev, suggestions: [] }));
      return;
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    
    setWizard(prev => ({ ...prev, isSearching: true }));
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchLocation(debouncedDestination);
        setWizard(prev => ({ ...prev, suggestions: results, isSearching: false }));
      } catch (e) {
        console.error(e);
        setWizard(prev => ({ ...prev, isSearching: false }));
      }
    }, 300);
  }, [debouncedDestination]);

  // Wizard functions
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
    let temp = { ...wizard.tempData, currencySymbol: '$', langName: 'English' };
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

      const newSettings: TripSettings = {
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
      
      const newItinerary: ItineraryItem[] = aiItinerary.map((item, index) => ({
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

      // Fetch coordinates for all items
      for (const item of newItinerary) {
        try {
          const coords = await getCoordinates(item.location);
          setItinerary(prev => prev.map(i => 
            i.id === item.id ? { ...i, lat: coords.lat, lon: coords.lon } : i
          ));
        } catch (e) {}
      }
      await saveData();
    } catch (e) {
      console.error('AI Generation Failed', e);
      alert('AI service unavailable or blocked. Creating a basic plan instead.');
      handleFinishWizard();
    } finally {
      setWizard(prev => ({ ...prev, loading: false }));
    }
  };

  const handleFinishWizard = async () => {
    const info = wizard.tempData;
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

    const newSettings: TripSettings = {
      isSetup: true,
      destination: wizard.destination,
      startDate: wizard.date,
      days: 3,
      users: ['Me', 'Partner'],
      currencyCode: wizard.currencyCode.toUpperCase(),
      currencySymbol: info.currencySymbol || '$',
      targetLang: targetLang,
      langName: info.langName || 'English',
    };

    setSettings(newSettings);

    let startLoc: ItineraryItem[];
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

    await fetchExchangeRate(newSettings.currencyCode).then(rate => setRealTimeRate(rate));
    await saveData();
    setViewState('app');

    if (info.latitude && info.longitude) {
      const weather = await fetchWeather(info.latitude, info.longitude);
      if (weather) {
        setItinerary(prev => prev.map(i => 
          i.id === startLoc[0].id ? { ...i, weather } : i
        ));
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

  // Map functions
  const initMap = async () => {
    if (mapRef.current) return;
    
    const el = document.getElementById('map');
    if (!el) return;
    
    const map = L.map('map', { zoomControl: false }).setView([0, 0], 2);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { attribution: '' }).addTo(map);
    mapRef.current = map;
    setMapReady(true);
    updateMapMarkers();
  };

  const initModalMap = async (lat: number, lon: number) => {
    const el = document.getElementById('modal-map');
    if (!el) return;

    if (modalMapRef.current) {
      modalMapRef.current.invalidateSize();
      modalMapRef.current.setView([lat, lon], 14);
    } else {
      const map = L.map('modal-map', { zoomControl: false }).setView([lat, lon], 14);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { attribution: '' }).addTo(map);
      modalMapRef.current = map;
    }

    if (modalMarkerRef.current) modalMapRef.current!.removeLayer(modalMarkerRef.current);
    const icon = L.divIcon({ className: 'bg-orange-500 border-4 border-white rounded-full shadow-xl w-6 h-6' });
    modalMarkerRef.current = L.marker([lat, lon], { icon }).addTo(modalMapRef.current!);
  };

  const updateMapMarkers = async () => {
    if (!mapRef.current) return;
    
    markersRef.current.forEach(m => mapRef.current!.removeLayer(m));
    markersRef.current = [];
    
    const bounds = L.latLngBounds([]);
    for (const item of filteredItinerary) {
      let lat: number | undefined = item.lat;
      let lon: number | undefined = item.lon;
      if (!lat) {
        const c = await getCoordinates(item.location);
        lat = c.lat;
        lon = c.lon;
      }
      if (lat !== undefined && lat !== 0 && lon !== undefined && lon !== 0) {
        const icon = L.divIcon({
          className: 'bg-transparent',
          html: `<div class="w-10 h-10 bg-stone-800 text-white rounded-full flex items-center justify-center shadow-xl border-4 border-white text-sm font-bold transform -translate-x-1/2 -translate-y-1/2 font-num">${item.time.split(':')[0]}</div>`,
        });
        markersRef.current.push(L.marker([lat, lon], { icon }).addTo(mapRef.current));
        bounds.extend([lat, lon]);
      }
    }
    if (markersRef.current.length) mapRef.current.fitBounds(bounds, { padding: [80, 80] });
  };

  const locateUser = () => {
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude, longitude } = pos.coords;
      if (userMarkerRef.current && mapRef.current) mapRef.current.removeLayer(userMarkerRef.current);
      const icon = L.divIcon({ className: 'bg-blue-500 border-4 border-white rounded-full shadow-xl w-4 h-4' });
      userMarkerRef.current = L.marker([latitude, longitude], { icon }).addTo(mapRef.current!);
      mapRef.current!.setView([latitude, longitude], 15);
    });
  };

  useEffect(() => {
    if (activeTab === 'map') {
      setTimeout(() => {
        initMap();
        updateMapMarkers();
      }, 100);
    }
  }, [activeTab, filteredItinerary]);

  // Globe modal
  const openGlobeModal = async (item: ItineraryItem) => {
    setActiveItemForGlobe(item);
    setShowGlobeModal(true);

    let { lat, lon } = item;
    if (!lat || !lon) {
      const coords = await getCoordinates(item.location);
      lat = coords.lat;
      lon = coords.lon;
    }

    if (lat && lon) {
      setTimeout(() => initModalMap(lat, lon), 200);
    }
  };

  // Itinerary functions
  const openAddModal = () => {
    if (activeTab === 'itinerary') {
      setIsEditing(false);
      setFormItinerary({ id: null, time: '09:00', location: '', note: '' });
      setShowItineraryModal(true);
    } else {
      setFormExpense({ amount: '', title: '', payer: settings.users[0] });
      setShowExpenseModal(true);
    }
  };

  const editItem = (item: ItineraryItem) => {
    setIsEditing(true);
    setFormItinerary({
      id: item.id,
      time: item.time,
      location: item.location,
      note: item.note || '',
    });
    setShowItineraryModal(true);
  };

  const saveItinerary = async () => {
    if (!formItinerary.location) return;
    
    const coords = await getCoordinates(formItinerary.location);
    const weather = await fetchWeather(coords.lat, coords.lon);
    const newItem: ItineraryItem = {
      ...formItinerary,
      id: formItinerary.id || Date.now(),
      dayIndex: currentDayIndex,
      lat: coords.lat,
      lon: coords.lon,
      weather: weather || undefined,
    };

    if (isEditing && formItinerary.id !== null) {
      await updateItineraryItem(newItem);
    } else {
      await addItineraryItem(newItem);
    }
    
    setShowItineraryModal(false);
  };

  const handleDeleteItineraryItem = (id: number) => {
    if (confirm('Delete?')) {
      deleteItineraryItem(id);
    }
  };

  // Expense functions
  const saveExpense = () => {
    if (!formExpense.amount) return;
    addExpense({
      amount: parseFloat(formExpense.amount.toString()),
      title: formExpense.title,
      payer: formExpense.payer,
    });
    setShowExpenseModal(false);
  };

  const handleDeleteExpense = (id: number) => {
    if (confirm('Delete?')) {
      deleteExpense(id);
    }
  };

  // Settings
  const saveSettings = () => {
    const users = tempUsersString.split(/[,，]/).map(s => s.trim()).filter(s => s);
    updateSettings({ users });
    setShowSettings(false);
  };

  const resetData = () => {
    if (confirm('Reset current trip?')) {
      setItinerary([]);
      setExpenses([]);
      setSettings(defaultSettings);
      saveData();
      setViewState('wizard');
    }
  };

  // Translator
  const handleTranslateText = async () => {
    if (!transInput) return;
    setTransLoading(true);
    try {
      const result = await translateText(transInput, settings.targetLang);
      setTransResult(result);
    } catch (e) {
      setTransResult('Translation error.');
    } finally {
      setTransLoading(false);
    }
  };

  // AI
  const handleAskAI = async (item: ItineraryItem) => {
    setShowAIModal(true);
    setAiLoading(true);
    setAiResponse('');

    try {
      const response = await askAI(item.location);
      setAiResponse(response);
    } catch (e) {
      console.error('AI Assistant Failed', e);
      setAiResponse('AI is currently unavailable due to network restrictions or offline mode. Please check your connection.');
    } finally {
      setAiLoading(false);
    }
  };

  // Google Maps
  const openGoogleMaps = (loc: string | undefined) => {
    if (!loc) return;
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc)}`, '_blank');
  };

  // Add day
  const addDay = () => {
    updateSettings({ days: settings.days + 1 });
  };

  // Create new trip
  const createNewTrip = () => {
    tripCreateNewTrip();
    setShowHistoryModal(false);
    setWizard(prev => ({ ...prev, destination: '', date: '', step: 1 }));
    setViewState('wizard');
  };

  // Handle login errors for guest
  const handleLoginAnonymously = async () => {
    try {
      await loginAnonymously();
    } catch (e) {
      // Guest mode fallback handled in useAuth
    }
  };

  return (
    <div className="h-screen overflow-hidden text-stone-800">
      <div className="ambient-bg"></div>
      <div className="ambient-orb bg-orange-200 w-96 h-96 top-[-10%] left-[-10%] mix-blend-multiply"></div>
      <div className="ambient-orb bg-yellow-200 w-80 h-80 bottom-[-10%] right-[-10%] mix-blend-multiply"></div>

      <div className="h-full flex flex-col relative z-10">
        {/* Loading */}
        {viewState === 'loading' && (
          <div className="fixed inset-0 z-[300] flex flex-col items-center justify-center p-6 text-center bg-[#FFFDE7]/80 backdrop-blur-md">
            <div className="w-16 h-16 border-4 border-stone-200 border-t-orange-500 rounded-full spin mb-4"></div>
            <p className="text-stone-500 font-bold animate-pulse">Syncing your journey...</p>
          </div>
        )}

        {/* Login */}
        {viewState === 'login' && (
          <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center p-6 text-center">
            <div className="absolute inset-0 bg-white/40 backdrop-blur-xl z-0"></div>
            <div className="relative z-10 w-full max-w-sm space-y-10">
              <div className="space-y-4">
                <div className="mx-auto mb-6 transform -rotate-12 hover:rotate-0 transition-transform duration-500">
                  <i className="ph ph-airplane-tilt text-8xl text-stone-800 drop-shadow-sm"></i>
                </div>
                <h1 className="text-6xl font-bold text-stone-800 tracking-tight">TravelFlow</h1>
                <p className="text-stone-600 font-medium text-lg tracking-wide">Your Journey, Synced.</p>
              </div>
              <div className="glass-panel p-8 rounded-[40px] space-y-4 shadow-xl ring-1 ring-white/60">
                <button
                  onClick={loginGoogle}
                  className="w-full bg-white hover:bg-stone-50 text-stone-700 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-md border border-stone-100 transition-all active:scale-[0.98]"
                >
                  Continue with Google
                </button>
                <button
                  onClick={handleLoginAnonymously}
                  className="w-full bg-stone-800 text-amber-50 py-4 rounded-2xl font-bold transition-all hover:bg-stone-700 active:scale-[0.98]"
                >
                  Start as Guest
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Wizard */}
        {viewState === 'wizard' && (
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
              {/* 3D Globe Visualization for Wizard */}
              <div className="order-1 md:order-2 flex flex-col items-center">
                <div id="wizard-globe-wrapper" className="w-[250px] h-[250px] rounded-full overflow-hidden bg-transparent">
                  <Globe
                    width={250}
                    height={250}
                    destination={wizard.tempData ? {
                      lat: wizard.tempData.latitude,
                      lon: wizard.tempData.longitude,
                      name: wizard.destination,
                    } : null}
                    isMini={true}
                  />
                </div>
                <div className="mt-4 text-stone-500 font-bold text-sm tracking-wide uppercase opacity-70">
                  Preview Destination
                </div>
              </div>

              {/* Input Form */}
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
                          className="w-full bg-white/60 border border-white/80 rounded-2xl px-5 py-4 text-xl font-bold text-stone-800 outline-none focus:ring-2 focus:ring-orange-300/50 transition-all font-num relative z-20"
                        />

                        {/* Suggestions Dropdown */}
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
                                  <div className="text-xs text-stone-500 truncate">
                                    {[item.admin1, item.country].filter(Boolean).join(', ')}
                                  </div>
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
                          <>
                            <i className="ph ph-spinner animate-spin"></i> Analyzing...
                          </>
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
                          onClick={handleFinishWizard}
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
        )}

        {/* Dashboard */}
        {viewState === 'app' && (
          <div className="h-full flex flex-col">
            <Header
              user={user}
              syncStatus={syncStatus}
              settings={settings}
              itinerary={itinerary}
              onShowHistory={() => setShowHistoryModal(true)}
              onShowTranslator={() => setShowTranslator(true)}
              onShowSettings={() => setShowSettings(true)}
            />

            <main className="flex-1 overflow-y-auto hide-scrollbar pb-safe-nav px-6 relative z-10 custom-scroll">
              {/* Itinerary */}
              {activeTab === 'itinerary' && (
                <div className="pt-6 space-y-8">
                  <div className="sticky top-0 z-20 -mx-6 px-6 py-4">
                    <div className="absolute inset-0 bg-gradient-to-b from-[#FFFDE7]/0 via-[#FFFDE7]/0 to-transparent pointer-events-none"></div>
                    <div className="flex overflow-x-auto gap-3 p-6 -m-6 hide-scrollbar snap-x snap-mandatory relative z-10">
                      {Array.from({ length: settings.days }).map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentDayIndex(index)}
                          className={`flex flex-col items-center justify-center min-w-[70px] h-[84px] rounded-[24px] transition-all duration-300 snap-center shrink-0 border backdrop-blur-md ${
                            currentDayIndex === index
                              ? 'bg-stone-800 text-amber-50 border-stone-800 shadow-xl scale-105'
                              : 'bg-white/40 text-stone-500 border-white/50 hover:bg-white/60'
                          }`}
                        >
                          <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Day</span>
                          <span className="text-3xl font-bold font-num">{index + 1}</span>
                        </button>
                      ))}
                      <button
                        onClick={addDay}
                        className="flex flex-col items-center justify-center min-w-[70px] h-[84px] rounded-[24px] bg-white/30 text-stone-400 border border-white/30 hover:bg-white/50 shrink-0 snap-center backdrop-blur-md"
                      >
                        <i className="ph ph-plus text-2xl"></i>
                      </button>
                    </div>
                  </div>
                  <div className="space-y-6 relative min-h-[50vh] pb-40">
                    <div className="absolute left-[19px] top-6 bottom-0 w-0.5 bg-stone-400/30 border-l border-dashed border-stone-400/30 z-0"></div>
                    {filteredItinerary.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-stone-400 z-10 relative">
                        <div className="w-24 h-24 rounded-full bg-white/40 flex items-center justify-center mb-4 shadow-sm backdrop-blur-sm">
                          <i className="ph ph-map-trifold text-4xl opacity-50"></i>
                        </div>
                        <p className="font-bold text-lg">Empty Schedule</p>
                      </div>
                    ) : (
                      filteredItinerary.map((item) => (
                        <div key={item.id} className="relative z-10 pl-14 group">
                          <div className="absolute left-[13px] top-7 w-3.5 h-3.5 bg-white border-4 border-stone-700 rounded-full z-10 shadow-[0_0_0_4px_rgba(255,255,255,0.4)]"></div>
                          <div
                            className="glass-card p-6 rounded-[32px] cursor-pointer overflow-hidden relative"
                            onClick={() => editItem(item)}
                          >
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-full blur-2xl opacity-60 pointer-events-none"></div>
                            <div className="flex justify-between items-start mb-2 relative z-10">
                              <span className="text-stone-800 font-num font-bold text-2xl tracking-tight">{item.time}</span>
                              {item.weather && (
                                <div className="flex items-center gap-1.5 text-stone-600 bg-white/60 backdrop-blur px-3 py-1 rounded-full text-xs font-bold border border-white/60 shadow-sm font-num">
                                  <i className={`ph ${getWeatherIcon(item.weather.code)} text-sm`}></i>
                                  <span>{item.weather.temp}°</span>
                                </div>
                              )}
                            </div>
                            <h3 className="font-bold text-stone-800 text-xl mb-2 leading-snug relative z-10">{item.location}</h3>
                            {item.note && (
                              <p className="text-stone-600 text-sm font-medium leading-relaxed mb-4 line-clamp-2 relative z-10 bg-white/30 p-2 rounded-xl">
                                {item.note}
                              </p>
                            )}
                            <div className="flex gap-2 pt-2 border-t border-stone-200/50 relative z-10">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAskAI(item);
                                }}
                                className="flex-1 bg-purple-100 hover:bg-purple-200 text-purple-700 text-sm py-3 rounded-2xl flex items-center justify-center gap-2 transition-all font-bold shadow-sm"
                              >
                                <i className="ph ph-sparkle"></i> Ask AI
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openGlobeModal(item);
                                }}
                                className="flex-1 bg-white/50 hover:bg-white text-stone-600 hover:text-orange-700 text-sm py-3 rounded-2xl flex items-center justify-center gap-2 transition-all font-bold shadow-sm"
                              >
                                <i className="ph ph-globe-hemisphere-west"></i> Show on Globe
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteItineraryItem(item.id);
                                }}
                                className="w-12 bg-white/50 hover:bg-rose-50 text-stone-400 hover:text-rose-500 py-3 rounded-2xl flex items-center justify-center transition-all shadow-sm"
                              >
                                <i className="ph ph-trash text-lg"></i>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Wallet */}
              {activeTab === 'wallet' && (
                <div className="pt-6 space-y-8 pb-40">
                  <div className="glass-dark rounded-[40px] p-8 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-400 to-yellow-500 rounded-full blur-[80px] opacity-20 group-hover:opacity-30 transition-opacity duration-700"></div>
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-stone-400 text-xs font-bold uppercase tracking-[0.2em]">Total Spent</div>
                        <div className="bg-white/10 px-3 py-1 rounded-xl text-[10px] font-bold backdrop-blur-md border border-white/10">
                          {settings.currencyCode}
                        </div>
                      </div>
                      <div className="flex items-baseline gap-1 mb-1">
                        <span className="text-3xl font-light font-num text-stone-300">{settings.currencySymbol}</span>
                        <span className="text-6xl font-bold tracking-tight text-white font-num">{totalExpense.toLocaleString()}</span>
                      </div>
                      <div className="text-stone-400 text-sm mb-10 flex items-center gap-2 font-medium">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]"></div>
                        ≈ HKD <span className="font-num">${Math.round(totalExpense * realTimeRate).toLocaleString()}</span>
                        <span className="opacity-40 text-xs font-mono">({realTimeRate.toFixed(3)})</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {Object.entries(balances).map(([name, balance]) => (
                          <div key={name} className="bg-white/5 p-5 rounded-3xl border border-white/5 backdrop-blur-sm">
                            <div className="text-[10px] text-stone-400 uppercase tracking-wider mb-2 font-bold">
                              {name} {balance >= 0 ? 'Gets' : 'Pays'}
                            </div>
                            <div className={`text-xl font-bold font-num ${balance >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                              {settings.currencySymbol}{Math.abs(balance).toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-800 text-lg mb-5 ml-2 flex items-center gap-2">
                      <span className="w-2 h-6 bg-stone-800 rounded-full"></span>Recent
                    </h3>
                    <div className="space-y-4">
                      {expenses.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-stone-300/30 rounded-[32px] bg-white/20">
                          <p className="text-stone-500 font-bold">No expenses yet</p>
                        </div>
                      ) : (
                        expenses.map((expense) => (
                          <div key={expense.id} className="glass-card p-5 rounded-3xl flex justify-between items-center">
                            <div className="flex items-center gap-5">
                              <div className="w-14 h-14 rounded-[20px] bg-white/60 border border-white flex items-center justify-center text-stone-400 shadow-sm">
                                <i className="ph ph-receipt text-2xl"></i>
                              </div>
                              <div>
                                <div className="font-bold text-stone-800 text-lg leading-tight mb-1">{expense.title}</div>
                                <div className="text-xs font-bold text-stone-500 flex items-center gap-1 bg-white/50 px-2 py-0.5 rounded-lg w-max">
                                  <i className="ph ph-user"></i>{expense.payer}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold font-num text-stone-800 text-xl">
                                {settings.currencySymbol}{expense.amount.toLocaleString()}
                              </div>
                              <div className="text-[10px] font-bold font-num text-stone-400 mt-1 bg-stone-100/80 px-2 py-1 rounded-lg inline-block">
                                ≈ ${Math.round(expense.amount * realTimeRate).toLocaleString()}
                              </div>
                              <button
                                onClick={() => handleDeleteExpense(expense.id)}
                                className="block ml-auto mt-2 text-xs font-bold text-rose-300 hover:text-rose-500 transition-colors uppercase tracking-wider"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Map */}
              {activeTab === 'map' && (
                <MapPanel mapReady={mapReady} currentDayIndex={currentDayIndex} locateUser={locateUser} />
              )}
            </main>

            <FAB openAddModal={openAddModal} activeTab={activeTab} />

            <NavBar tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>
        )}

        {/* Modals */}
        
        {/* Globe Modal */}
        {showGlobeModal && (
          <div className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center bg-stone-900/40 backdrop-blur-xl">
            <div className="glass-modal w-full sm:w-[500px] sm:rounded-[40px] rounded-t-[40px] p-6 shadow-2xl pb-safe-nav border-t border-white/50 max-h-[90vh] flex flex-col overflow-y-auto custom-scroll">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-stone-800 flex items-center gap-2">
                  <i className="ph ph-globe-hemisphere-west text-orange-500"></i> Location View
                </h3>
                <button
                  onClick={() => setShowGlobeModal(false)}
                  className="bg-stone-100 p-2 rounded-full text-stone-500 hover:text-stone-800 transition-colors"
                >
                  <i className="ph ph-x text-lg"></i>
                </button>
              </div>

              <div id="modal-map-container" className="w-full bg-stone-100 rounded-3xl shadow-inner mb-4 relative h-[300px]">
                <div id="modal-map" className="absolute inset-0 w-full h-full rounded-3xl"></div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xl font-bold text-stone-800">{activeItemForGlobe?.location}</h4>
                {activeItemForGlobe?.note && (
                  <p className="text-stone-500 text-sm font-medium">{activeItemForGlobe.note}</p>
                )}
                <div className="pt-2">
                  <button
                    onClick={() => openGoogleMaps(activeItemForGlobe?.location)}
                    className="w-full bg-blue-50 text-blue-600 font-bold py-3 rounded-xl hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <i className="ph ph-google-logo"></i> Open in Google Maps
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* History Modal */}
        {showHistoryModal && (
          <div className="fixed inset-0 z-[150] flex items-end justify-center sm:items-center bg-stone-900/30 backdrop-blur-xl">
            <div className="glass-modal w-full sm:w-[450px] sm:rounded-[40px] rounded-t-[40px] p-8 shadow-2xl pb-safe-nav border-t border-white/50 h-[80vh] flex flex-col overflow-y-auto custom-scroll">
              <div className="flex justify-between items-center mb-6 shrink-0">
                <h3 className="text-3xl font-bold text-stone-800 flex items-center gap-2">My Trips</h3>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="bg-stone-100 p-2 rounded-full text-stone-500 hover:text-stone-800 transition-colors"
                >
                  <i className="ph ph-x text-lg"></i>
                </button>
              </div>

              <div className="space-y-4 overflow-y-auto flex-1 hide-scrollbar">
                <div
                  onClick={createNewTrip}
                  className="p-6 rounded-[28px] border-2 border-dashed border-stone-300 text-stone-400 hover:border-orange-400 hover:text-orange-500 hover:bg-orange-50/50 cursor-pointer transition-all flex items-center justify-center gap-2 group"
                >
                  <i className="ph ph-plus-circle text-2xl group-hover:scale-110 transition-transform"></i>
                  <span className="font-bold">Plan New Trip</span>
                </div>

                {Object.entries(allTrips).map(([id, trip]) => (
                  <div
                    key={id}
                    onClick={() => switchTrip(id)}
                    className={`group relative overflow-hidden p-6 rounded-[28px] border transition-all cursor-pointer hover:scale-[1.02] ${
                      currentTripId === id
                        ? 'bg-stone-800 text-white border-stone-800 shadow-xl'
                        : 'bg-white/60 border-white/60 hover:bg-white text-stone-800'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-2xl font-bold truncate max-w-[200px] leading-tight">
                        {trip.settings.destination.split(',')[0]}
                      </div>
                      {currentTripId === id && (
                        <div className="text-[10px] font-bold bg-white/20 px-2 py-1 rounded-full uppercase tracking-widest text-white/80">
                          Active
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-sm font-medium opacity-70 mb-4">
                      <i className="ph ph-calendar"></i> {formatDate(trip.settings.startDate)}
                    </div>

                    <div className={`flex justify-between items-center border-t pt-3 ${
                      currentTripId === id ? 'border-white/20' : 'border-stone-200'
                    }`}>
                      <span className="text-xs font-bold uppercase tracking-wider opacity-60">
                        {trip.settings.days} Days
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTrip(id);
                        }}
                        className={`p-2 rounded-full transition-colors z-10 hover:bg-rose-500 hover:text-white ${
                          currentTripId === id ? 'text-white/40 hover:bg-white/20' : 'text-stone-300 hover:bg-rose-50'
                        }`}
                      >
                        <i className="ph ph-trash text-lg"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Translator Modal */}
        {showTranslator && (
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-stone-900/30 backdrop-blur-xl">
            <div className="bg-white/95 backdrop-blur-xl w-full sm:w-[450px] sm:rounded-[40px] rounded-t-[40px] p-8 shadow-2xl pb-safe-nav border-t border-white/50 h-[70vh] flex flex-col overflow-y-auto custom-scroll">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-stone-800 flex items-center gap-2">
                  <i className="ph ph-translate text-orange-500"></i> Translator
                </h3>
                <button
                  onClick={() => setShowTranslator(false)}
                  className="bg-stone-100 p-2 rounded-full text-stone-500 hover:text-stone-800 transition-colors"
                >
                  <i className="ph ph-x text-lg"></i>
                </button>
              </div>

              <div className="space-y-4 flex-1 overflow-y-auto">
                <textarea
                  value={transInput}
                  onChange={(e) => setTransInput(e.target.value)}
                  placeholder="Enter text to translate..."
                  className="w-full h-32 bg-stone-50/50 p-5 rounded-[24px] outline-none text-lg resize-none placeholder-stone-400 focus:bg-white focus:ring-0 shadow-inner transition-colors duration-300"
                ></textarea>

                <div className="flex justify-between items-center px-2">
                  <span className="text-xs font-bold text-stone-400">English ➔ {settings.langName}</span>
                  <button
                    onClick={handleTranslateText}
                    disabled={transLoading}
                    className="bg-stone-800 text-white px-6 py-3 rounded-xl font-bold shadow-lg active:scale-95 transition-transform flex items-center gap-2"
                  >
                    {transLoading ? (
                      <i className="ph ph-spinner animate-spin"></i>
                    ) : (
                      'Translate'
                    )}
                  </button>
                </div>

                {transResult && (
                  <div className="bg-orange-50 p-6 rounded-[24px] mt-4 border border-orange-100 shadow-inner">
                    <div className="text-xs font-bold text-orange-300 uppercase mb-2">Translation (Google)</div>
                    <div className="text-xl font-bold text-stone-800">{transResult}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Itinerary Modal */}
        {showItineraryModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-stone-900/30 backdrop-blur-xl">
            <div className="bg-white/95 backdrop-blur-xl w-full sm:w-[450px] sm:rounded-[40px] rounded-t-[40px] p-8 shadow-2xl pb-safe-nav border-t border-white/50 overflow-y-auto custom-scroll max-h-[90vh]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-3xl font-bold text-stone-800">{isEditing ? 'Edit' : 'New'} Event</h3>
                <button
                  onClick={() => setShowItineraryModal(false)}
                  className="bg-stone-100 p-2 rounded-full text-stone-500 hover:text-stone-800 transition-colors"
                >
                  <i className="ph ph-x text-lg"></i>
                </button>
              </div>
              <div className="space-y-6">
                <div className="bg-stone-50 p-5 rounded-[24px] border border-stone-100">
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Time</label>
                  <input
                    value={formItinerary.time}
                    onChange={(e) => setFormItinerary(prev => ({ ...prev, time: e.target.value }))}
                    type="time"
                    className="w-full bg-transparent text-3xl font-bold font-num text-stone-800 outline-none"
                  />
                </div>
                <div className="bg-stone-50 p-5 rounded-[24px] border border-stone-100">
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Location</label>
                  <input
                    value={formItinerary.location}
                    onChange={(e) => setFormItinerary(prev => ({ ...prev, location: e.target.value }))}
                    type="text"
                    placeholder="Place name"
                    className="w-full bg-transparent text-xl font-bold text-stone-800 outline-none placeholder-stone-300"
                  />
                </div>
                <div className="bg-stone-50 p-5 rounded-[24px] border border-stone-100">
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Notes</label>
                  <textarea
                    value={formItinerary.note}
                    onChange={(e) => setFormItinerary(prev => ({ ...prev, note: e.target.value }))}
                    rows={3}
                    placeholder="Details..."
                    className="w-full bg-transparent text-lg font-medium text-stone-600 outline-none resize-none placeholder-stone-300"
                  ></textarea>
                </div>
                <button
                  onClick={saveItinerary}
                  className="w-full bg-stone-800 text-white font-bold py-5 rounded-[24px] shadow-xl hover:bg-stone-700 active:scale-[0.98] transition-all text-lg"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AI Modal */}
        {showAIModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-stone-900/30 backdrop-blur-xl">
            <div className="bg-white/95 backdrop-blur-xl w-full sm:w-[450px] sm:rounded-[40px] rounded-t-[40px] p-8 shadow-2xl pb-safe-nav border-t border-white/50 h-[70vh] flex flex-col overflow-y-auto custom-scroll">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-stone-800 flex items-center gap-2">
                  <i className="ph ph-sparkle text-purple-500"></i> AI Travel Guide
                </h3>
                <button
                  onClick={() => setShowAIModal(false)}
                  className="bg-stone-100 p-2 rounded-full text-stone-500 hover:text-stone-800 transition-colors"
                >
                  <i className="ph ph-x text-lg"></i>
                </button>
              </div>
              <div className="space-y-4 flex-1">
                {aiLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full spin mb-4"></div>
                    <p className="text-stone-500 font-bold animate-pulse">Consulting Gemini...</p>
                  </div>
                ) : (
                  <div className="prose prose-stone">
                    <p className="text-lg font-medium text-stone-700 whitespace-pre-wrap">{aiResponse}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Expense Modal */}
        {showExpenseModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-stone-900/30 backdrop-blur-xl">
            <div className="bg-white/95 backdrop-blur-xl w-full sm:w-[450px] sm:rounded-[40px] rounded-t-[40px] p-8 shadow-2xl pb-safe-nav border-t border-white/50 overflow-y-auto custom-scroll max-h-[90vh]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-3xl font-bold text-stone-800">Add Expense</h3>
                <button
                  onClick={() => setShowExpenseModal(false)}
                  className="bg-stone-100 p-2 rounded-full text-stone-500 hover:text-stone-800 transition-colors"
                >
                  <i className="ph ph-x text-lg"></i>
                </button>
              </div>
              <div className="space-y-6">
                <div className="bg-stone-50 p-5 rounded-[24px] border border-stone-100 relative overflow-hidden">
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Amount ({settings.currencyCode})</label>
                  <div className="relative z-10">
                    <span className="absolute left-0 top-1/2 transform -translate-y-1/2 text-3xl font-num text-stone-400">{settings.currencySymbol}</span>
                    <input
                      value={formExpense.amount}
                      onChange={(e) => setFormExpense(prev => ({ ...prev, amount: e.target.value }))}
                      type="number"
                      pattern="\d*"
                      placeholder="0"
                      className="w-full bg-transparent pl-8 text-5xl font-bold font-num outline-none text-stone-800 placeholder-stone-200"
                    />
                  </div>
                  {formExpense.amount && (
                    <div className="text-right mt-3 text-xs font-bold text-orange-600 bg-orange-50 inline-block px-3 py-1.5 rounded-lg ml-auto">
                      ≈ HKD <span className="font-num">${Math.round(parseFloat(formExpense.amount.toString()) * realTimeRate).toLocaleString()}</span>
                    </div>
                  )}
                </div>
                <div className="bg-stone-50 p-5 rounded-[24px] border border-stone-100">
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Item</label>
                  <input
                    value={formExpense.title}
                    onChange={(e) => setFormExpense(prev => ({ ...prev, title: e.target.value }))}
                    type="text"
                    placeholder="What for?"
                    className="w-full bg-transparent text-xl font-bold text-stone-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-3 ml-1">Paid By</label>
                  <div className="flex gap-2 overflow-x-auto hide-scrollbar p-6 -m-6 pb-4">
                    {settings.users.map((user) => (
                      <button
                        key={user}
                        onClick={() => setFormExpense(prev => ({ ...prev, payer: user }))}
                        className={`px-6 py-4 rounded-[20px] text-sm font-bold transition-all border shrink-0 shadow-sm ${
                          formExpense.payer === user
                            ? 'bg-stone-800 text-white border-stone-800 transform scale-105'
                            : 'bg-white text-stone-500 border-stone-100 hover:border-stone-300'
                        }`}
                      >
                        {user}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={saveExpense}
                  className="w-full bg-stone-800 text-white font-bold py-5 rounded-[24px] shadow-xl hover:bg-stone-700 active:scale-[0.98] transition-all text-lg"
                >
                  Add Expense
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Settings Modal */}
        {showSettings && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowSettings(false);
            }}
          >
            <div className="bg-white/95 backdrop-blur w-[340px] rounded-[32px] p-8 shadow-2xl ring-1 ring-white/50">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-stone-800">Settings</h3>
                <button onClick={logout} className="text-xs text-rose-500 font-bold px-3 py-1 bg-rose-50 rounded-lg">
                  Log Out
                </button>
              </div>
              <div className="space-y-5">
                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
                  <label className="block text-[10px] text-stone-400 uppercase tracking-wider font-bold mb-1">User</label>
                  <div className="text-sm font-bold text-stone-700 truncate">{user?.email || 'Guest'}</div>
                </div>
                <div>
                  <label className="block text-[10px] text-stone-400 uppercase tracking-wider font-bold mb-2 ml-1">Travelers</label>
                  <input
                    value={tempUsersString}
                    onChange={(e) => setTempUsersString(e.target.value)}
                    type="text"
                    className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-3 outline-none focus:border-stone-800 transition-all text-stone-700 font-medium"
                  />
                </div>
                <div className="pt-2 flex gap-3">
                  <button
                    onClick={resetData}
                    className="flex-1 text-rose-500 text-sm border border-rose-100 bg-rose-50 py-3 rounded-2xl hover:bg-rose-100 transition-colors font-bold"
                  >
                    Reset Trip
                  </button>
                  <button
                    onClick={saveSettings}
                    className="flex-[2] bg-stone-800 text-white font-bold py-3 rounded-2xl shadow-lg hover:bg-stone-700 transition-all"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;