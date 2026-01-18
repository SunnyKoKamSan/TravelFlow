import { ItineraryItem, TripSettings } from '../types';
import { getWeatherIcon } from '../lib/api';

interface Props {
  currentDayIndex: number;
  setCurrentDayIndex: (n: number) => void;
  settingsDays: number;
  filteredItinerary: ItineraryItem[];
  addDay: () => void;
  deleteDay: (dayIndex: number) => void;
  editItem: (item: ItineraryItem) => void;
  openGlobeModal: (item: ItineraryItem) => void;
  handleAskAI: (item: ItineraryItem) => void;
  handleDeleteItineraryItem: (id: number) => void;
  addTransport: () => void;
  settings?: TripSettings;
}

const calculateDuration = (startTime: string, endTime: string): string => {
  if (!startTime || !endTime) return '';
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  let totalMinutes = (endH * 60 + endM) - (startH * 60 + startM);
  if (totalMinutes < 0) totalMinutes += 24 * 60;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
};

const formatDayDate = (startDate: string, dayIndex: number): string => {
  if (!startDate) return '';
  const date = new Date(startDate);
  date.setDate(date.getDate() + dayIndex);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekday = weekdays[date.getDay()];
  return `${month}/${day} (${weekday})`;
};

const getTransportIcon = (mode?: string): string => {
  switch (mode) {
    case 'flight': return 'ph-airplane-tilt';
    case 'train': return 'ph-train';
    case 'taxi': return 'ph-taxi';
    default: return 'ph-car';
  }
};

export default function ItineraryView({ 
  currentDayIndex, 
  setCurrentDayIndex, 
  settingsDays, 
  filteredItinerary, 
  addDay, 
  deleteDay,
  editItem, 
  openGlobeModal, 
  handleAskAI, 
  handleDeleteItineraryItem,
  addTransport,
  settings 
}: Props) {
  const dayDate = settings?.startDate ? formatDayDate(settings.startDate, currentDayIndex) : '';
  const isFirstDay = currentDayIndex === 0;
  const isLastDay = currentDayIndex === settingsDays - 1;
  const showTransportSection = isFirstDay || isLastDay;
  
  const transportItems = filteredItinerary.filter(item => item.type === 'transport');
  const activityItems = filteredItinerary.filter(item => item.type !== 'transport');
  
  return (
    <div className="pt-6 space-y-8">
      <div className="sticky top-0 z-20 -mx-6 px-6 py-4">
        <div className="absolute inset-0 bg-gradient-to-b from-[#FFFDE7]/0 via-[#FFFDE7]/0 to-transparent pointer-events-none"></div>
        <div className="flex overflow-x-auto gap-3 p-6 -m-6 hide-scrollbar snap-x snap-mandatory relative z-10">
          {Array.from({ length: settingsDays }).map((_, index) => {
            const buttonDate = settings?.startDate ? formatDayDate(settings.startDate, index) : '';
            return (
              <div key={index} className="relative shrink-0 snap-center">
                <button
                  onClick={() => setCurrentDayIndex(index)}
                  className={`flex flex-col items-center justify-center min-w-[75px] h-[90px] rounded-[24px] transition-all duration-300 border backdrop-blur-md ${
                    currentDayIndex === index
                      ? 'bg-stone-800 text-amber-50 border-stone-800 shadow-xl scale-105'
                      : 'bg-white/40 text-stone-500 border-white/50 hover:bg-white/60'
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Day</span>
                  <span className="text-2xl font-bold font-num">{index + 1}</span>
                  {buttonDate && (
                    <span className={`text-[9px] font-bold ${currentDayIndex === index ? 'text-amber-200' : 'text-stone-400'}`}>
                      {buttonDate}
                    </span>
                  )}
                </button>
                {settingsDays > 1 && currentDayIndex === index && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteDay(index);
                    }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-rose-600 transition-colors z-20"
                  >
                    <i className="ph ph-x text-xs font-bold"></i>
                  </button>
                )}
              </div>
            );
          })}
          <button
            onClick={addDay}
            className="flex flex-col items-center justify-center min-w-[75px] h-[90px] rounded-[24px] bg-white/30 text-stone-400 border border-white/30 hover:bg-white/50 shrink-0 snap-center backdrop-blur-md"
          >
            <i className="ph ph-plus text-2xl"></i>
          </button>
        </div>
      </div>

      {/* Transport Section - Only on First/Last Day */}
      {showTransportSection && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4 px-4">
            <div className="flex items-center gap-2">
              <i className="ph ph-airplane-takeoff text-orange-500 text-lg"></i>
              <span className="text-stone-600 font-bold text-sm uppercase tracking-wider">
                {isFirstDay ? 'Departure' : 'Return'} Transport
              </span>
            </div>
            <button
              onClick={addTransport}
              className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-lg"
            >
              <i className="ph ph-plus-circle"></i>
              Add Transport
            </button>
          </div>
          
          {transportItems.length === 0 ? (
            <div 
              onClick={addTransport}
              className="mx-4 p-6 border-2 border-dashed border-orange-300 rounded-[24px] bg-orange-50/50 cursor-pointer hover:bg-orange-100/50 transition-colors"
            >
              <div className="flex flex-col items-center text-orange-400">
                <i className="ph ph-airplane-tilt text-3xl mb-2"></i>
                <span className="font-bold">No transport added</span>
                <span className="text-sm">Tap to add flight, train, or taxi</span>
              </div>
            </div>
          ) : (
          <div className="space-y-4">
            {transportItems.map((item) => (
              <div key={item.id} className="relative z-10 pl-4">
                <div
                  className="glass-card p-5 rounded-[32px] cursor-pointer overflow-hidden relative border-l-4 border-orange-400"
                  onClick={() => editItem(item)}
                >
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-orange-200 to-amber-100 rounded-full blur-2xl opacity-60 pointer-events-none"></div>
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center shrink-0 shadow-sm">
                      <i className={`ph ${getTransportIcon(item.transportMode)} text-2xl text-orange-600`}></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {item.transportNumber && (
                          <span className="text-xs font-bold bg-stone-800 text-amber-50 px-2 py-0.5 rounded-lg">
                            {item.transportNumber}
                          </span>
                        )}
                        <span className="text-xs text-stone-500 font-medium capitalize">
                          {item.transportMode || 'Transport'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="flex flex-col items-center">
                          <span className="font-num font-bold text-stone-800">{item.time}</span>
                          <span className="text-xs text-stone-500 font-bold truncate max-w-[60px]">{item.origin || '---'}</span>
                        </div>
                        <div className="flex-1 flex items-center gap-1 px-2">
                          <div className="flex-1 h-px bg-stone-300"></div>
                          {item.time && item.endTime && (
                            <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                              {calculateDuration(item.time, item.endTime)}
                            </span>
                          )}
                          <div className="flex-1 h-px bg-stone-300"></div>
                          <i className="ph ph-arrow-right text-stone-400"></i>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="font-num font-bold text-stone-800">{item.endTime || '--:--'}</span>
                          <span className="text-xs text-stone-500 font-bold truncate max-w-[60px]">{item.location}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-3 mt-3 border-t border-stone-200/50 relative z-10">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleAskAI(item); }}
                      className="flex-1 bg-purple-100 hover:bg-purple-200 text-purple-700 text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all font-bold shadow-sm"
                    >
                      <i className="ph ph-sparkle"></i> AI Help
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteItineraryItem(item.id); }}
                      className="w-10 bg-white/50 hover:bg-rose-50 text-stone-400 hover:text-rose-500 py-2.5 rounded-xl flex items-center justify-center transition-all shadow-sm"
                    >
                      <i className="ph ph-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      )}

      <div className="space-y-6 relative min-h-[50vh] pb-40">
        {dayDate && (
          <div className="pl-4 mb-2 flex items-center justify-between">
            <span className="text-stone-500 font-bold text-sm">{dayDate}</span>
            {activityItems.length > 0 && (
              <span className="text-stone-400 text-xs font-medium">{activityItems.length} activities</span>
            )}
          </div>
        )}
        <div className="absolute left-[19px] top-6 bottom-0 w-0.5 bg-stone-400/30 border-l border-dashed border-stone-400/30 z-0"></div>
        
        {activityItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-stone-400 z-10 relative">
            <div className="w-24 h-24 rounded-full bg-white/40 flex items-center justify-center mb-4 shadow-sm backdrop-blur-sm">
              <i className="ph ph-map-trifold text-4xl opacity-50"></i>
            </div>
            <p className="font-bold text-lg">No Activities Yet</p>
            <p className="text-sm mt-1">Tap + to add your first activity</p>
          </div>
        ) : (
          activityItems.map((item) => (
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
