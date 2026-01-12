import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from './hooks/useAuth';
import { useTrip } from './hooks/useTrip';
import Header from './components/Header';
import NavBar from './components/NavBar';
import FAB from './components/FAB';
import MapPanel from './components/MapPanel';
import { getCoordinates, fetchWeather, fetchExchangeRate, translateText, askAI } from './lib/api';
import { formatDate } from './lib/utils';
import { ItineraryItem, TripSettings } from './types';
import L from 'leaflet';
import LoginView from './components/LoginView';
import Wizard from './components/Wizard';
import ItineraryView from './components/ItineraryView';
import WalletView from './components/WalletView';

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

  const [viewState, setViewState] = useState<'loading' | 'login' | 'wizard' | 'app'>('loading');
  const [activeTab, setActiveTab] = useState<'itinerary' | 'wallet' | 'map'>('itinerary');
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [realTimeRate, setRealTimeRate] = useState(1);
  const [mapReady, setMapReady] = useState(false);
  
  const [showItineraryModal, setShowItineraryModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTranslator, setShowTranslator] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showGlobeModal, setShowGlobeModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [formItinerary, setFormItinerary] = useState({ id: null as number | null, time: '', location: '', note: '' });
  const [formExpense, setFormExpense] = useState({ amount: '', title: '', payer: 'Me' });
  const [tempUsersString, setTempUsersString] = useState('');
  
  const [transInput, setTransInput] = useState('');
  const [transResult, setTransResult] = useState('');
  const [transLoading, setTransLoading] = useState(false);
  
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  
  const [activeItemForGlobe, setActiveItemForGlobe] = useState<ItineraryItem | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const modalMapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const modalMarkerRef = useRef<L.Marker | null>(null);

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
    } else if (!settings.isSetup) {
      setViewState('wizard');
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
      setViewState('wizard');
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

  const handleAskAI = async (item: ItineraryItem) => {
    setShowAIModal(true);
    setAiLoading(true);
    setAiResponse('Loading recommendations...');

    try {
      const response = await askAI(item.location);
      setAiResponse(response);
    } catch (e) {
      console.error('AI Assistant Failed', e);
      setAiResponse('AI recommendations are currently unavailable. Please try again later or check your Hugging Face API key configuration.');
    } finally {
      setAiLoading(false);
    }
  };

  const openGoogleMaps = (loc: string | undefined) => {
    if (!loc) return;
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc)}`, '_blank');
  };

  const addDay = () => {
    updateSettings({ days: settings.days + 1 });
  };

  const createNewTrip = () => {
    tripCreateNewTrip();
    setShowHistoryModal(false);
    setViewState('wizard');
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

        {/* Wizard */}
        {viewState === 'wizard' && (
          <Wizard
            setSettings={setSettings}
            setItinerary={setItinerary}
            setExpenses={setExpenses}
            saveData={saveData}
            setCurrentTripId={setCurrentTripId}
            setViewState={setViewState}
            allTrips={allTrips}
            switchTrip={switchTrip}
            currentTripId={currentTripId}
          />
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
onBack={() => {
                // Go back to wizard/planning destination page
                setViewState('wizard');
              }}
            />

            <main className="flex-1 overflow-y-auto hide-scrollbar pb-safe-nav px-6 relative z-10 custom-scroll">
              {/* Itinerary */}
              {activeTab === 'itinerary' && (
                <ItineraryView
                  currentDayIndex={currentDayIndex}
                  setCurrentDayIndex={setCurrentDayIndex}
                  settingsDays={settings.days}
                  filteredItinerary={filteredItinerary}
                  addDay={addDay}
                  editItem={editItem}
                  openGlobeModal={openGlobeModal}
                  handleAskAI={handleAskAI}
                  handleDeleteItineraryItem={handleDeleteItineraryItem}
                />
              )}

              {activeTab === 'wallet' && (
                <WalletView
                  expenses={expenses}
                  balances={balances}
                  settings={settings}
                  realTimeRate={realTimeRate}
                  handleDeleteExpense={handleDeleteExpense}
                />
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