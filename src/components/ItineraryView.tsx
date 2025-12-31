import { ItineraryItem } from '../types';
import { getWeatherIcon } from '../lib/api';

interface Props {
  currentDayIndex: number;
  setCurrentDayIndex: (n: number) => void;
  settingsDays: number;
  filteredItinerary: ItineraryItem[];
  addDay: () => void;
  editItem: (item: ItineraryItem) => void;
  openGlobeModal: (item: ItineraryItem) => void;
  handleAskAI: (item: ItineraryItem) => void;
  handleDeleteItineraryItem: (id: number) => void;
}

export default function ItineraryView({ currentDayIndex, setCurrentDayIndex, settingsDays, filteredItinerary, addDay, editItem, openGlobeModal, handleAskAI, handleDeleteItineraryItem }: Props) {
  return (
    <div className="pt-6 space-y-8">
      <div className="sticky top-0 z-20 -mx-6 px-6 py-4">
        <div className="absolute inset-0 bg-gradient-to-b from-[#FFFDE7]/0 via-[#FFFDE7]/0 to-transparent pointer-events-none"></div>
        <div className="flex overflow-x-auto gap-3 p-6 -m-6 hide-scrollbar snap-x snap-mandatory relative z-10">
          {Array.from({ length: settingsDays }).map((_, index) => (
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
                    onClick={(e) => { e.stopPropagation(); handleAskAI(item); }}
                    className="flex-1 bg-purple-100 hover:bg-purple-200 text-purple-700 text-sm py-3 rounded-2xl flex items-center justify-center gap-2 transition-all font-bold shadow-sm"
                  >
                    <i className="ph ph-sparkle"></i> Ask AI
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); openGlobeModal(item); }}
                    className="flex-1 bg-white/50 hover:bg-white text-stone-600 hover:text-orange-700 text-sm py-3 rounded-2xl flex items-center justify-center gap-2 transition-all font-bold shadow-sm"
                  >
                    <i className="ph ph-globe-hemisphere-west"></i> Show on Globe
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteItineraryItem(item.id); }}
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
  );
}
