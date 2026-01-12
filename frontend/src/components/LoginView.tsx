interface LoginViewProps {
  loginGoogle: () => void;
  handleLoginAnonymously: () => void;
  error?: string | null;
}

export default function LoginView({ loginGoogle, handleLoginAnonymously, error }: LoginViewProps) {
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
          {error ? (
            <div className="px-4 py-3 rounded-2xl bg-red-50 border border-red-100 text-red-700 text-sm font-semibold">
              {error}
            </div>
          ) : null}

          <button
            onClick={loginGoogle}
            className="w-full bg-white hover:bg-stone-50 text-stone-700 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-md border border-stone-100 transition-all active:scale-[0.98]"
          >
            {/* ADDED: Official Colored Google SVG Icon */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
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