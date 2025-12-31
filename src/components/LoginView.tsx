interface LoginViewProps {
  loginGoogle: () => void;
  handleLoginAnonymously: () => void;
}

export default function LoginView({ loginGoogle, handleLoginAnonymously }: LoginViewProps) {
  return (
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
  );
}
