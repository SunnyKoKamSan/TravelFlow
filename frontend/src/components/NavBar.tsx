import type { Dispatch, SetStateAction } from 'react';

interface Tab { id: 'itinerary' | 'wallet' | 'map'; label: string; icon: string; iconFill: string }

interface NavBarProps {
  tabs: Tab[];
  activeTab: string;
  setActiveTab: Dispatch<SetStateAction<'itinerary' | 'wallet' | 'map'>>;
}

export default function NavBar({ tabs, activeTab, setActiveTab }: NavBarProps) {
  return (
    <nav className="fixed bottom-6 left-6 right-6 z-40">
      <div className="glass-panel rounded-[32px] h-20 flex justify-around items-center px-2 shadow-[0_20px_40px_-12px_rgba(255,224,178,0.5)] ring-1 ring-white/50">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center justify-center w-full h-full rounded-[24px] transition-all duration-300 group relative ${
              activeTab === tab.id ? 'text-stone-900' : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            {activeTab === tab.id && (
              <div className="absolute inset-0 bg-white/60 rounded-[24px] m-2 shadow-sm z-0 backdrop-blur-sm"></div>
            )}
            <div className="relative z-10 flex flex-col items-center">
              <i className={`ph text-2xl mb-1 transition-transform duration-300 ${activeTab === tab.id ? `${tab.iconFill} scale-110` : tab.icon}`}></i>
              <span className="text-[10px] font-bold tracking-wider uppercase">{tab.label}</span>
            </div>
          </button>
        ))}
      </div>
    </nav>
  );
}
