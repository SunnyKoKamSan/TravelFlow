import Globe from './Globe';
import { formatDate } from '../lib/utils';

interface HeaderProps {
  user: any;
  syncStatus: string;
  settings: any;
  itinerary: any[];
  expenses?: any[];
  balances?: Record<string, number>;
  onShowTranslator: () => void;
  onShowSettings: () => void;
  onShowHistory: () => void;
  onExportPDF?: () => void;
}

export default function Header({ user, syncStatus, settings, itinerary, expenses, balances, onShowTranslator, onShowSettings, onShowHistory, onExportPDF }: HeaderProps) {
  // Get language names for translator shortcuts
  const departureLang = settings.departureLangName || 'English';
  const destLang = settings.langName || 'English';
  
  return (
    <header className="pt-safe-top px-6 pb-2 z-20 flex justify-between items-start shrink-0 transition-all duration-300">
      <div className="flex items-start gap-4">
        {/* Mini Globe in Header */}
        <div id="mini-globe-container" className="w-20 h-20 rounded-full bg-black/10 shrink-0 hidden sm:block relative overflow-hidden ring-2 ring-white/50 shadow-lg pointer-events-none">
          <Globe width={80} height={80} items={itinerary} isMini={true} />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="text-[10px] font-bold text-stone-500 uppercase tracking-widest opacity-80">Current Trip</div>
          </div>
          {/* Trip Route: Departure → Destination - Fixed styling */}
          <div className="flex items-center gap-2 flex-wrap">
            {settings.departureCity && (
              <>
                <span className="text-xl font-bold text-stone-600">
                  {settings.departureCity.split(',')[0]}
                </span>
                <i className="ph ph-airplane-tilt text-orange-500 text-lg"></i>
              </>
            )}
            <span className="text-xl font-bold text-stone-800">
              {settings.destination.split(',')[0]}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="glass-panel px-3 py-1 rounded-full text-xs font-bold text-stone-600 border border-white/40 font-num">
              {formatDate(settings.startDate)}
            </span>
            {settings.departureCurrencyCode && settings.departureCurrencyCode !== settings.currencyCode && (
              <span className="bg-blue-100/60 text-blue-700 px-2 py-1 rounded-full text-[10px] font-bold">
                {settings.departureCurrencyCode} → {settings.currencyCode}
              </span>
            )}
            {/* Translator shortcuts with bidirectional language */}
            <button
              onClick={onShowTranslator}
              className="bg-stone-800/90 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-1 active:scale-95 transition-transform backdrop-blur-md"
            >
              <i className="ph ph-translate"></i>
              {departureLang !== destLang ? (
                <span className="hidden sm:inline">{departureLang.slice(0, 3)} ↔ {destLang.slice(0, 3)}</span>
              ) : (
                <span className="hidden sm:inline">Translate</span>
              )}
            </button>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 mb-2">
        {/* Export PDF Button */}
        {onExportPDF && (
          <button
            onClick={onExportPDF}
            className="hidden sm:flex w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 items-center justify-center text-white transition-all active:scale-95 shadow-lg hover:shadow-xl"
            title="Export Trip to PDF"
          >
            <i className="ph-fill ph-file-pdf text-xl"></i>
          </button>
        )}
        {/* Trip Plan Management Button - Mobile only (sidebar has it on desktop) */}
        <button
          onClick={onShowHistory}
          className="md:hidden w-12 h-12 rounded-full glass-panel flex items-center justify-center text-stone-600 hover:text-orange-600 transition-colors active:scale-95 shadow-sm"
          title="My Trips"
        >
          <i className="ph ph-airplane-tilt text-xl"></i>
        </button>
        {syncStatus === 'syncing' && (
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shadow-glow"></div>
        )}
        {syncStatus === 'online' && (
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-glow"></div>
        )}
        {syncStatus !== 'syncing' && syncStatus !== 'online' && (
          <div className="w-2.5 h-2.5 rounded-full bg-rose-400"></div>
        )}
        <button
          onClick={onShowSettings}
          className="w-12 h-12 rounded-full glass-panel flex items-center justify-center text-stone-600 hover:text-orange-600 transition-colors active:scale-95 shadow-sm"
        >
          {user?.photoURL ? (
            <img src={user.photoURL} alt="User" className="w-full h-full rounded-full object-cover opacity-90" />
          ) : (
            <i className="ph ph-user-circle text-2xl"></i>
          )}
        </button>
      </div>
    </header>
  );
}
