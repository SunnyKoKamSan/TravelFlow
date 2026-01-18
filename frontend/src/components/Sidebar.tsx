import type { Dispatch, SetStateAction } from 'react';

interface Tab { id: 'itinerary' | 'wallet' | 'map'; label: string; icon: string; iconFill: string }

interface SidebarProps {
  tabs: Tab[];
  activeTab: string;
  setActiveTab: Dispatch<SetStateAction<'itinerary' | 'wallet' | 'map'>>;
  destination?: string;
  onShowHistory?: () => void;
}

export default function Sidebar({ tabs, activeTab, setActiveTab, destination, onShowHistory }: SidebarProps) {
  return (
    <aside className="hidden md:flex flex-col w-20 lg:w-64 h-full bg-white/60 backdrop-blur-xl border-r border-white/50 shrink-0 z-40">
      {/* Logo / Trip Indicator */}
      <div className="p-4 lg:p-6 border-b border-white/50">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-300 flex items-center justify-center shadow-lg shrink-0">
            <i className="ph ph-airplane-tilt text-white text-xl"></i>
          </div>
          <div className="hidden lg:block overflow-hidden">
            <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">TravelFlow</div>
            {destination && (
              <div className="text-sm font-bold text-stone-700 truncate">{destination.split(',')[0]}</div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-3 lg:p-4 space-y-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full flex items-center gap-3 p-3 lg:px-4 lg:py-3 rounded-2xl transition-all duration-300 group ${
              activeTab === tab.id
                ? 'bg-stone-800 text-white shadow-lg'
                : 'text-stone-500 hover:bg-white/60 hover:text-stone-700'
            }`}
          >
            <i className={`ph text-xl ${activeTab === tab.id ? tab.iconFill : tab.icon}`}></i>
            <span className="hidden lg:block font-bold text-sm">{tab.label}</span>
            {activeTab === tab.id && (
              <div className="hidden lg:block ml-auto w-2 h-2 rounded-full bg-orange-400"></div>
            )}
          </button>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="p-3 lg:p-4 border-t border-white/50 space-y-2">
        {onShowHistory && (
          <button
            onClick={onShowHistory}
            className="w-full flex items-center gap-3 p-3 lg:px-4 lg:py-3 rounded-2xl text-stone-500 hover:bg-orange-50 hover:text-orange-600 transition-all"
          >
            <i className="ph ph-stack text-xl"></i>
            <span className="hidden lg:block font-bold text-sm">My Trips</span>
          </button>
        )}
      </div>
    </aside>
  );
}
