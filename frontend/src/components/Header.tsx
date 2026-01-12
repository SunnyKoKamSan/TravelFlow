import Globe from './Globe';
import { formatDate } from '../lib/utils';

interface HeaderProps {
  user: any;
  syncStatus: string;
  settings: any;
  itinerary: any[];
  onShowHistory: () => void;
  onShowTranslator: () => void;
  onShowSettings: () => void;
  onBack?: () => void; // Optional back button handler
}

export default function Header({ user, syncStatus, settings, itinerary, onShowHistory, onShowTranslator, onShowSettings, onBack }: HeaderProps) {
  return (
    <header className="pt-safe-top px-6 pb-2 z-20 flex justify-between items-start shrink-0 transition-all duration-300">
      <div className="flex items-start gap-4">
        {/* Back Button (optional) */}
        {onBack && (
          <button
            onClick={onBack}
            className="w-12 h-12 rounded-full glass-panel flex items-center justify-center text-stone-600 hover:text-stone-800 transition-colors shadow-sm ring-1 ring-white/50 shrink-0"
          >
            <i className="ph ph-arrow-left text-xl"></i>
          </button>
        )}

        {/* Mini Globe in Header */}
        <div id="mini-globe-container" className="w-20 h-20 rounded-full bg-black/10 shrink-0 hidden sm:block relative overflow-hidden ring-2 ring-white/50 shadow-lg pointer-events-none">
          <Globe width={80} height={80} items={itinerary} isMini={true} />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="text-[10px] font-bold text-stone-500 uppercase tracking-widest opacity-80">Current Trip</div>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-stone-800 leading-tight drop-shadow-sm max-w-[50vw] sm:max-w-md truncate leading-tight">
              {settings.destination.split(',')[0]}
            </h1>
            <button
              onClick={onShowHistory}
              className="w-8 h-8 rounded-full bg-white/40 hover:bg-white flex items-center justify-center text-stone-600 transition-colors shadow-sm ring-1 ring-white/50 shrink-0"
            >
              <i className="ph ph-caret-down text-sm"></i>
            </button>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="glass-panel px-3 py-1 rounded-full text-xs font-bold text-stone-600 border border-white/40 font-num">
              {formatDate(settings.startDate)}
            </span>
            <button
              onClick={onShowTranslator}
              className="bg-stone-800/90 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-1 active:scale-95 transition-transform backdrop-blur-md"
            >
              <i className="ph ph-translate"></i> Translate
            </button>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 mb-2">
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
