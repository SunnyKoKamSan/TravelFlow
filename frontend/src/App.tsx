import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from './hooks/useAuth';
import { useTrip } from './hooks/useTrip';
import Header from './components/Header';
import NavBar from './components/NavBar';
import Sidebar from './components/Sidebar';
import FAB from './components/FAB';
import MapPanel from './components/MapPanel';
import { getCoordinates, fetchWeather, fetchExchangeRate, translateText, getAirlineFromCode } from './lib/api';
import { formatDate } from './lib/utils';
import { exportTripToPDF } from './lib/pdfExport';
import { ItineraryItem, TripSettings } from './types';
import L from 'leaflet';
import LoginView from './components/LoginView';
import ItineraryView from './components/ItineraryView';
import WalletView from './components/WalletView';

const defaultSettings: TripSettings = {
  isSetup: false,
  destination: '',
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

function App() {
  const { user, loading: authLoading, loginGoogle, loginAnonymously, logout } = useAuth();
  const userId = user?.uid || null;

  const [authError, setAuthError] = useState<string | null>(null);
  
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

  const [viewState, setViewState] = useState<'loading' | 'login' | 'app'>('loading');
  const [activeTab, setActiveTab] = useState<'itinerary' | 'wallet' | 'map'>('itinerary');
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [realTimeRate, setRealTimeRate] = useState(1);
  const [mapReady, setMapReady] = useState(false);
  
  const [showItineraryModal, setShowItineraryModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTranslator, setShowTranslator] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showGlobeModal, setShowGlobeModal] = useState(false);
  const [showTransportModal, setShowTransportModal] = useState(false);
  const [showPDFConfirm, setShowPDFConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [formItinerary, setFormItinerary] = useState({ 
    id: null as number | null, 
    time: '', 
    location: '', 
    note: '',
    type: 'activity' as 'activity' | 'transport',
    transportMode: '' as '' | 'flight' | 'train' | 'taxi',
    transportNumber: '',
    origin: '',
    endTime: '',
  });
  const [formExpense, setFormExpense] = useState({ amount: '', title: '', payer: 'Me' });
  const [tempUsersString, setTempUsersString] = useState('');
  
  const [transInput, setTransInput] = useState('');
  const [transResult, setTransResult] = useState('');
  const [transLoading, setTransLoading] = useState(false);
  
  // Airline info for transport (display only - no real-time API)
  const airlineInfo = formItinerary.transportNumber ? getAirlineFromCode(formItinerary.transportNumber) : null;
  
  const [activeItemForGlobe, setActiveItemForGlobe] = useState<ItineraryItem | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const modalMapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const modalMarkerRef = useRef<L.Marker | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const [isTrackingLocation, setIsTrackingLocation] = useState(false);

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

  useEffect(() => {
    if (authLoading) {
      setViewState('loading');
      return;
    }

    if (!user) {
      setViewState('login');
    } else {
      setViewState('app');
    }
  }, [user, authLoading, settings.isSetup]);

  useEffect(() => {
    setTempUsersString(settings.users.join(', '));
  }, [settings.users]);

  useEffect(() => {
    if (settings.currencyCode) {
      fetchExchangeRate(settings.currencyCode).then(rate => setRealTimeRate(rate));
    }
  }, [settings.currencyCode]);

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
    // If already tracking, stop tracking
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setIsTrackingLocation(false);
      return;
    }

    // Start real-time tracking
    setIsTrackingLocation(true);
    
    const updateUserPosition = (pos: GeolocationPosition) => {
      const { latitude, longitude } = pos.coords;
      if (userMarkerRef.current && mapRef.current) {
        mapRef.current.removeLayer(userMarkerRef.current);
      }
      const icon = L.divIcon({ 
        className: 'bg-transparent',
        html: `<div class="w-5 h-5 bg-blue-500 border-4 border-white rounded-full shadow-xl animate-pulse"></div>`
      });
      userMarkerRef.current = L.marker([latitude, longitude], { icon }).addTo(mapRef.current!);
      mapRef.current!.setView([latitude, longitude], 15);
    };

    const handleError = (err: GeolocationPositionError) => {
      console.warn('Geolocation error:', err.message);
      setIsTrackingLocation(false);
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };

    // Use watchPosition for real-time tracking
    watchIdRef.current = navigator.geolocation.watchPosition(
      updateUserPosition,
      handleError,
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
  };

  // Cleanup watch on unmount or tab change
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Stop tracking when leaving map tab
  useEffect(() => {
    if (activeTab !== 'map' && watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setIsTrackingLocation(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'map') {
      setTimeout(() => {
        initMap();
        updateMapMarkers();
      }, 100);
    }
  }, [activeTab, filteredItinerary]);

  // Update modal map when globe modal opens or activeItemForGlobe changes
  useEffect(() => {
    if (showGlobeModal && activeItemForGlobe) {
      const lat = activeItemForGlobe.lat || 0;
      const lon = activeItemForGlobe.lon || 0;
      if (lat !== 0 && lon !== 0) {
        setTimeout(() => initModalMap(lat, lon), 200);
      } else if (activeItemForGlobe.location) {
        getCoordinates(activeItemForGlobe.location).then(coords => {
          setTimeout(() => initModalMap(coords.lat, coords.lon), 200);
        });
      }
    }
  }, [showGlobeModal, activeItemForGlobe]);

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

  const openAddModal = () => {
    if (activeTab === 'itinerary') {
      setIsEditing(false);
      setFormItinerary({ 
        id: null, 
        time: '09:00', 
        location: '', 
        note: '',
        type: 'activity',
        transportMode: '',
        transportNumber: '',
        origin: '',
        endTime: '',
      });
      setShowItineraryModal(true);
    } else {
      setFormExpense({ amount: '', title: '', payer: settings.users[0] });
      setShowExpenseModal(true);
    }
  };

  const editItem = (item: ItineraryItem) => {
    // If it's a transport item, use dedicated transport modal handled by addTransport
    if (item.type === 'transport') {
      setIsEditing(true);
      setFormItinerary({
        id: item.id,
        time: item.time,
        location: item.location,
        note: item.note || '',
        type: 'transport',
        transportMode: item.transportMode || 'flight',
        transportNumber: item.transportNumber || '',
        origin: item.origin || '',
        endTime: item.endTime || '',
      });
      setShowTransportModal(true);
      return;
    }
    
    // For activity items, use the standard itinerary modal
    setIsEditing(true);
    setFormItinerary({
      id: item.id,
      time: item.time,
      location: item.location,
      note: item.note || '',
      type: 'activity',
      transportMode: '',
      transportNumber: '',
      origin: '',
      endTime: '',
    });
    setShowItineraryModal(true);
  };

  // Add transport - opens dedicated transport modal
  const addTransport = () => {
    setIsEditing(false);
    setFormItinerary({
      id: null,
      time: currentDayIndex === 0 ? '08:00' : '15:00',
      location: currentDayIndex === 0 ? settings.destination : settings.departureCity || 'Home',
      note: '',
      type: 'transport',
      transportMode: 'flight',
      transportNumber: '',
      origin: currentDayIndex === 0 ? (settings.departureCity || 'Home') : settings.destination,
      endTime: currentDayIndex === 0 ? '12:00' : '19:00',
    });
    setShowTransportModal(true);
  };

  const saveItinerary = async () => {
    if (!formItinerary.location) return;
    
    const coords = await getCoordinates(formItinerary.location);
    const weather = await fetchWeather(coords.lat, coords.lon);
    const newItem: ItineraryItem = {
      id: formItinerary.id || Date.now(),
      dayIndex: currentDayIndex,
      time: formItinerary.time,
      location: formItinerary.location,
      note: formItinerary.note,
      lat: coords.lat,
      lon: coords.lon,
      weather: weather || undefined,
      type: formItinerary.type,
      transportMode: formItinerary.transportMode || undefined,
      transportNumber: formItinerary.transportNumber || undefined,
      origin: formItinerary.origin || undefined,
      endTime: formItinerary.endTime || undefined,
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
    }
  };

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

  const handleExportPDF = () => {
    if (!settings.isSetup) {
      alert('Please set up your trip first');
      return;
    }
    
    // Show confirmation modal instead of direct export
    setShowPDFConfirm(true);
  };

  const confirmExportPDF = () => {
    try {
      exportTripToPDF({
        settings,
        itinerary,
        expenses,
        balances
      });
      setShowPDFConfirm(false);
    } catch (error) {
      console.error('Failed to export PDF:', error);
      alert('Failed to export PDF. Please try again.');
    }
  };

  const openGoogleMaps = (loc: string | undefined) => {
    if (!loc) return;
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc)}`, '_blank');
  };

  const addDay = () => {
    updateSettings({ days: settings.days + 1 });
  };

  const deleteDay = (dayIndex: number) => {
    if (settings.days <= 1) return; // Don't delete the last day
    
    // Remove all itinerary items for this day and shift remaining days
    const updatedItinerary = itinerary
      .filter(item => item.dayIndex !== dayIndex)
      .map(item => ({
        ...item,
        dayIndex: item.dayIndex > dayIndex ? item.dayIndex - 1 : item.dayIndex
      }));
    
    // Update settings and itinerary
    updateSettings({ days: settings.days - 1 });
    // Update itinerary via the trip hook
    updatedItinerary.forEach((item, idx) => {
      if (itinerary[idx]?.dayIndex !== item.dayIndex) {
        updateItineraryItem(item);
      }
    });
    // Remove items that were on the deleted day
    itinerary
      .filter(item => item.dayIndex === dayIndex)
      .forEach(item => deleteItineraryItem(item.id));
    
    // Adjust current day index if needed
    if (currentDayIndex >= settings.days - 1) {
      setCurrentDayIndex(Math.max(0, settings.days - 2));
    }
  };

  const createNewTrip = () => {
    tripCreateNewTrip();
    setShowHistoryModal(false);
  };

  const handleLoginAnonymously = async () => {
    try {
      setAuthError(null);
      await loginAnonymously();
    } catch (e) {
      
    }
  };

  const hintFromAuthError = (message: string): string => {
    // Give helpful next-steps for the common Firebase Auth misconfig issues
    const m = message.toLowerCase();
    if (m.includes('auth/unauthorized-domain')) {
      return 'Unauthorized domain. In Firebase Console → Auth → Settings → Authorized domains, add localhost (and your production domain).';
    }
    if (m.includes('auth/popup-blocked')) {
      return 'Popup blocked. Allow popups for this site and try again.';
    }
    if (m.includes('auth/popup-closed-by-user')) {
      return 'Popup was closed—try again and keep the popup open until it finishes.';
    }
    if (m.includes('auth/operation-not-allowed')) {
      return 'Provider not enabled. In Firebase Console → Authentication → Sign-in method, enable Google/Apple.';
    }
    return message;
  };

  const handleLoginGoogle = async () => {
    try {
      setAuthError(null);
      await loginGoogle();
    } catch (e: any) {
      setAuthError(hintFromAuthError(e?.message || 'Login failed'));
    }
  };

  /* Apple login disabled until Apple Developer account is configured
  const handleLoginApple = async () => {
    try {
      setAuthError(null);
      await loginApple();
    } catch (e: any) {
      setAuthError(hintFromAuthError(e?.message || 'Apple login failed'));
    }
  };
  */

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
          <LoginView
            loginGoogle={handleLoginGoogle}
            handleLoginAnonymously={handleLoginAnonymously}
            error={authError}
          />
        )}

        {/* Dashboard */}
        {viewState === 'app' && (
          <div className="h-full flex">
            {/* Left Sidebar - Desktop only */}
            <Sidebar
              tabs={tabs}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              destination={settings.destination}
              onShowHistory={() => setShowHistoryModal(true)}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              <Header
                user={user}
                syncStatus={syncStatus}
                settings={settings}
                itinerary={itinerary}
                expenses={expenses}
                balances={balances}
                onShowTranslator={() => setShowTranslator(true)}
                onShowSettings={() => setShowSettings(true)}
                onShowHistory={() => setShowHistoryModal(true)}
                onExportPDF={handleExportPDF}
              />

              <main className="flex-1 overflow-y-auto hide-scrollbar pb-safe-nav md:pb-6 px-6 relative z-10 custom-scroll">
                {/* Itinerary */}
                {activeTab === 'itinerary' && (
                  <ItineraryView
                    currentDayIndex={currentDayIndex}
                    setCurrentDayIndex={setCurrentDayIndex}
                    settingsDays={settings.days}
                    filteredItinerary={filteredItinerary}
                    addDay={addDay}
                    deleteDay={deleteDay}
                    editItem={editItem}
                    openGlobeModal={openGlobeModal}
                    handleDeleteItineraryItem={handleDeleteItineraryItem}
                    addTransport={addTransport}
                    settings={settings}
                  />
                )}

                {activeTab === 'wallet' && (
                  <WalletView
                    expenses={expenses}
                    balances={balances}
                    settings={settings}
                    realTimeRate={realTimeRate}
                    handleDeleteExpense={handleDeleteExpense}
                    addExpense={addExpense}
                  />
                )}

                {/* Map */}
                {activeTab === 'map' && (
                  <MapPanel mapReady={mapReady} currentDayIndex={currentDayIndex} locateUser={locateUser} isTrackingLocation={isTrackingLocation} />
                )}
              </main>

              <FAB openAddModal={openAddModal} activeTab={activeTab} />

              {/* Bottom NavBar - Mobile only */}
              <div className="md:hidden">
                <NavBar tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
              </div>
            </div>
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

                {Object.keys(allTrips).length === 0 ? (
                  <div className="text-center py-12 text-stone-400">
                    <i className="ph ph-airplane-tilt text-6xl mb-4 block opacity-30"></i>
                    <p className="font-medium">No saved trips yet</p>
                    <p className="text-sm mt-2">Click above to create your first trip!</p>
                  </div>
                ) : (
                  Object.entries(allTrips).map(([id, trip]) => (
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
                  ))
                )}
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
                {/* Translator Shortcut Buttons */}
                <div className="flex gap-2 mb-2">
                  <a
                    href={`https://translate.google.com/?sl=${settings.departureLangCode || 'en'}&tl=${settings.targetLang || 'ja'}&op=translate`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-stone-800 text-amber-50 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-stone-700 active:scale-95 transition-all shadow-md"
                  >
                    <i className="ph"></i>
                    {settings.departureLangName || 'English'} → {settings.langName || 'Local'}
                  </a>
                  <a
                    href={`https://translate.google.com/?sl=${settings.targetLang || 'ja'}&tl=${settings.departureLangCode || 'en'}&op=translate`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-orange-100 text-orange-700 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-orange-200 active:scale-95 transition-all shadow-sm border border-orange-200"
                  >
                    <i className="ph"></i>
                    {settings.langName || 'Local'} → {settings.departureLangName || 'English'}
                  </a>
                </div>

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
              <div className="space-y-5">
                {/* Activity type only - Transport is handled in the dedicated Transport section */}
                <div className="bg-stone-50 px-4 py-3 rounded-2xl border border-stone-100">
                  <div className="flex items-center gap-2 text-stone-600">
                    <i className="ph ph-map-pin text-lg"></i>
                    <span className="font-bold text-sm">Activity</span>
                  </div>
                </div>

                {/* Time */}
                <div className="bg-stone-50 p-5 rounded-[24px] border border-stone-100">
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Time</label>
                  <input
                    value={formItinerary.time}
                    onChange={(e) => setFormItinerary(prev => ({ ...prev, time: e.target.value }))}
                    type="time"
                    className="w-full bg-transparent text-3xl font-bold font-num text-stone-800 outline-none"
                  />
                </div>

                {/* Location */}
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

                {/* Notes */}
                <div className="bg-stone-50 p-5 rounded-[24px] border border-stone-100">
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Notes</label>
                  <textarea
                    value={formItinerary.note}
                    onChange={(e) => setFormItinerary(prev => ({ ...prev, note: e.target.value }))}
                    rows={2}
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

        {/* Transport Modal - Dedicated modal for transport items */}
        {showTransportModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-stone-900/30 backdrop-blur-xl">
            <div className="bg-white/95 backdrop-blur-xl w-full sm:w-[450px] sm:rounded-[40px] rounded-t-[40px] p-8 shadow-2xl pb-safe-nav border-t border-white/50 overflow-y-auto custom-scroll max-h-[90vh]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-3xl font-bold text-stone-800 flex items-center gap-2">
                  <i className="ph ph-airplane-tilt text-orange-500"></i>
                  {isEditing ? 'Edit' : 'Add'} Transport
                </h3>
                <button
                  onClick={() => setShowTransportModal(false)}
                  className="bg-stone-100 p-2 rounded-full text-stone-500 hover:text-stone-800 transition-colors"
                >
                  <i className="ph ph-x text-lg"></i>
                </button>
              </div>
              <div className="space-y-5">
                {/* Transport Mode Selection */}
                <div className="flex gap-2">
                  {[
                    { mode: 'flight', icon: 'ph-airplane-tilt', label: 'Flight' },
                    { mode: 'train', icon: 'ph-train', label: 'Train' },
                    { mode: 'taxi', icon: 'ph-taxi', label: 'Taxi' },
                  ].map(({ mode, icon, label }) => (
                    <button
                      key={mode}
                      onClick={() => setFormItinerary(prev => ({ ...prev, transportMode: mode as 'flight' | 'train' | 'taxi' }))}
                      className={`flex-1 py-3 rounded-xl text-sm font-bold flex flex-col items-center gap-1 transition-all ${
                        formItinerary.transportMode === mode
                          ? 'bg-orange-100 text-orange-600 border-2 border-orange-300'
                          : 'bg-stone-50 text-stone-400 border border-stone-200'
                      }`}
                    >
                      <i className={`ph ${icon} text-xl`}></i>
                      {label}
                    </button>
                  ))}
                </div>

                {/* Flight/Train Number */}
                <div className="bg-stone-50 p-4 rounded-[24px] border border-stone-100">
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">
                    {formItinerary.transportMode === 'flight' ? 'Flight Number' : formItinerary.transportMode === 'train' ? 'Train Number' : 'Vehicle Info'}
                  </label>
                  <input
                    value={formItinerary.transportNumber}
                    onChange={(e) => setFormItinerary(prev => ({ ...prev, transportNumber: e.target.value.toUpperCase() }))}
                    type="text"
                    placeholder={formItinerary.transportMode === 'flight' ? 'e.g. CX123, UO866' : 'e.g. G1234'}
                    className="w-full bg-white/60 border border-white/80 rounded-xl px-4 py-3 text-lg font-bold text-stone-800 outline-none focus:ring-2 focus:ring-orange-300/50"
                  />
                  {/* Show airline name if recognized */}
                  {airlineInfo && formItinerary.transportMode === 'flight' && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-orange-600">
                      <i className="ph ph-airplane-tilt"></i>
                      <span className="font-bold">{airlineInfo.name}</span>
                      <span className="text-stone-400">({airlineInfo.hub})</span>
                    </div>
                  )}
                </div>

                {/* Origin */}
                <div className="bg-stone-50 p-4 rounded-[24px] border border-stone-100">
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">From (Origin)</label>
                  <input
                    value={formItinerary.origin}
                    onChange={(e) => setFormItinerary(prev => ({ ...prev, origin: e.target.value }))}
                    type="text"
                    placeholder="e.g. Hong Kong, HKG"
                    className="w-full bg-transparent text-lg font-bold text-stone-800 outline-none placeholder-stone-300"
                  />
                </div>

                {/* Destination */}
                <div className="bg-stone-50 p-4 rounded-[24px] border border-stone-100">
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">To (Destination)</label>
                  <input
                    value={formItinerary.location}
                    onChange={(e) => setFormItinerary(prev => ({ ...prev, location: e.target.value }))}
                    type="text"
                    placeholder="Arrival location"
                    className="w-full bg-transparent text-lg font-bold text-stone-800 outline-none placeholder-stone-300"
                  />
                </div>

                {/* Times */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-stone-50 p-4 rounded-[24px] border border-stone-100">
                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Depart</label>
                    <input
                      value={formItinerary.time}
                      onChange={(e) => setFormItinerary(prev => ({ ...prev, time: e.target.value }))}
                      type="time"
                      className="w-full bg-transparent text-2xl font-bold font-num text-stone-800 outline-none"
                    />
                  </div>
                  <div className="bg-stone-50 p-4 rounded-[24px] border border-stone-100">
                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Arrive</label>
                    <input
                      value={formItinerary.endTime}
                      onChange={(e) => setFormItinerary(prev => ({ ...prev, endTime: e.target.value }))}
                      type="time"
                      className="w-full bg-transparent text-2xl font-bold font-num text-stone-800 outline-none"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="bg-stone-50 p-4 rounded-[24px] border border-stone-100">
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Notes</label>
                  <textarea
                    value={formItinerary.note}
                    onChange={(e) => setFormItinerary(prev => ({ ...prev, note: e.target.value }))}
                    rows={2}
                    placeholder="Terminal, gate, booking reference..."
                    className="w-full bg-transparent text-lg font-medium text-stone-600 outline-none resize-none placeholder-stone-300"
                  ></textarea>
                </div>

                <button
                  onClick={() => {
                    saveItinerary();
                    setShowTransportModal(false);
                  }}
                  className="w-full bg-orange-500 text-white font-bold py-5 rounded-[24px] shadow-xl hover:bg-orange-600 active:scale-[0.98] transition-all text-lg"
                >
                  Save Transport
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AI Modal */}

        {/* PDF Export Confirmation Modal */}
        {showPDFConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-sm">
            <div className="bg-white/95 backdrop-blur-xl w-[90%] max-w-md rounded-[32px] p-8 shadow-2xl border border-white/50 animate-[slideUp_0.2s_ease-out]">
              <div className="flex flex-col items-center text-center">
                {/* Icon */}
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mb-6 shadow-lg">
                  <i className="ph-fill ph-file-pdf text-white text-4xl"></i>
                </div>
                
                {/* Title */}
                <h3 className="text-2xl font-bold text-stone-800 mb-3">Export to PDF</h3>
                
                {/* Description */}
                <p className="text-stone-600 font-medium mb-2">
                  Your trip plan will be saved as a PDF document
                </p>
                <p className="text-sm text-stone-500 mb-8">
                  Includes itinerary, expenses, and settlement details
                </p>
                
                {/* Buttons */}
                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => setShowPDFConfirm(false)}
                    className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold py-4 rounded-2xl transition-colors active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmExportPDF}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <i className="ph-fill ph-download-simple text-xl"></i>
                    Download PDF
                  </button>
                </div>
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
                    onClick={() => {
                      setShowSettings(false);
                      handleExportPDF();
                    }}
                    className="flex-1 text-white text-sm bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 py-3 rounded-2xl transition-all font-bold flex items-center justify-center gap-2 shadow-lg"
                  >
                    <i className="ph-fill ph-file-pdf"></i>
                    Export PDF
                  </button>
                  <button
                    onClick={resetData}
                    className="flex-1 text-rose-500 text-sm border border-rose-100 bg-rose-50 py-3 rounded-2xl hover:bg-rose-100 transition-colors font-bold"
                  >
                    Reset Trip
                  </button>
                </div>
                <div className="pt-0 flex gap-3">
                  <button
                    onClick={saveSettings}
                    className="flex-1 bg-stone-800 text-white font-bold py-3 rounded-2xl shadow-lg hover:bg-stone-700 transition-all"
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