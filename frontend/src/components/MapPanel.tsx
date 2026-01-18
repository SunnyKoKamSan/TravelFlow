interface MapPanelProps {
  mapReady: boolean;
  currentDayIndex: number;
  locateUser: () => void;
  isTrackingLocation?: boolean;
}

export default function MapPanel({ mapReady, currentDayIndex, locateUser, isTrackingLocation }: MapPanelProps) {
  return (
    <div className="h-full relative w-full bg-stone-100 rounded-[40px] shadow-inner flex flex-col overflow-hidden">
      <div id="map-container-fix" className="flex-1 relative w-full h-full">
        <div
          id="map"
          className={`absolute inset-0 w-full h-full z-10 opacity-0 transition-opacity duration-700 ${
            mapReady ? 'opacity-100' : ''
          }`}
        ></div>
      </div>
      <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 z-[1000] glass-panel px-6 py-3 rounded-full shadow-2xl flex items-center gap-5 border border-white/60">
        <span className="text-xs font-black uppercase tracking-widest text-stone-500">
          Day <span className="font-num">{currentDayIndex + 1}</span>
        </span>
        <div className="w-px h-4 bg-stone-300"></div>
        <button
          onClick={locateUser}
          className={`transition-colors flex items-center gap-2 font-bold ${
            isTrackingLocation 
              ? 'text-blue-600 hover:text-blue-700' 
              : 'text-stone-800 hover:text-orange-600'
          }`}
        >
          <i className={`ph ${isTrackingLocation ? 'ph-crosshair-simple' : 'ph-crosshair'} text-lg ${isTrackingLocation ? 'animate-pulse' : ''}`}></i>
          <span className="text-xs">{isTrackingLocation ? 'Tracking' : 'Locate'}</span>
        </button>
      </div>
    </div>
  );
}
