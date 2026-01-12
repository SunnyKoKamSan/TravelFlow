# TravelFlow Pro 🌍✈️

**TravelFlow Pro** is a modern, AI-powered travel planning application designed to streamline your trips. Built with React, TypeScript, and Firebase, it combines interactive 3D visualizations, real-time expense tracking, and AI-generated itineraries into a seamless PWA experience.

- **🌐 Global Access**: Works anywhere without VPN requirement
- **🤖 AI-Powered**: Free AI integration with Hugging Face (no costly API keys)
- **📱 Cross-Platform**: PWA-enabled, works on mobile and desktop

![React](https://img.shields.io/badge/React-18-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-5.0-purple?style=flat-square&logo=vite)
![Firebase](https://img.shields.io/badge/Firebase-10-orange?style=flat-square&logo=firebase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-cyan?style=flat-square&logo=tailwindcss)

## ✨ Key Features

- **🤖 AI Trip Planner**: Generate complete, day-by-day itineraries instantly using free Hugging Face AI (or integrate Claude/Gemini)
- **🌍 Interactive 3D Globe**: Visualize your destinations on a stunning, interactive 3D globe with real-time location display
- **💰 Expense Tracker**: Seamless shared wallet to track expenses, split bills, and calculate balances between travelers
- **📍 Smart Mapping**: View your daily routes and locations on interactive Leaflet maps with automatic coordinate resolution
- **🔄 Real-time Sync**: All data is instantly synced across devices using Firebase Cloud Firestore
- **🗣️ Live Translator**: Built-in translation tools to help you communicate anywhere
- **📱 PWA Support**: Installable on mobile devices with offline capabilities
- **🎯 Location Recognition**: Supports complex location names including Japanese (心斎橋, 浅草寺), Chinese, and other international place names

## 🛠️ Tech Stack

- **Frontend Framework**: React 18 + Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Backend & Auth**: Firebase (Auth, Firestore)
- **Maps & Visuals**: Three.js (3D Globe), Leaflet (Interactive Maps), Open-Meteo + Nominatim (Geocoding)
- **AI Integration**: Hugging Face Inference API (free tier, works globally)
- **State Management**: React Hooks (Custom Hooks)

## 🚀 Quick Start

More detailed docs are in `docs/`:
- `docs/START_HERE.md`
- `docs/QUICK_START.md`
- `docs/SETUP_GUIDE.md`
- `docs/ARCHITECTURE.md`
- `docs/AUTH_AND_AI_SETUP.md`

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- A Firebase account (free tier eligible)
- A Hugging Face account (free, for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/SunnyKoKamSan/TravelFlow.git
   cd TravelFlow
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Create a new project
   - Enable Authentication (Google & Anonymous)
   - Enable Firestore Database
   - Get your Firebase config credentials

4. **Set up Hugging Face AI (Optional but Recommended)**
   - Sign up at [Hugging Face](https://huggingface.co)
   - Create an API token at [Hugging Face Settings](https://huggingface.co/settings/tokens)
   - This is free and works globally without VPN

5. **Configure Environment Variables**
   - Copy `.env.example` to `.env.local`:
     ```bash
     cp .env.example .env.local
     ```
   - Fill in your credentials:
     ```env
     # Firebase (Required)
     VITE_FIREBASE_API_KEY=your_firebase_api_key
     VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
     VITE_FIREBASE_PROJECT_ID=your_project_id
     VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
     VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
     VITE_FIREBASE_APP_ID=your_app_id

     # Hugging Face AI (Optional, for AI features)
     VITE_HF_API_KEY=your_huggingface_api_token
     ```

6. **Run the development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

## 📜 Available Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Starts the development server with HMR |
| `npm run build` | Builds the app for production (TypeScript compile + Vite build) |
| `npm run lint` | Runs ESLint to check for code quality issues |
| `npm run preview` | Locally preview the production build |

## 📂 Project Structure

```text
src/
├── components/
│   ├── Globe.tsx           # 3D Globe visualization (Three.js)
│   ├── Header.tsx          # App header with mini-globe
│   ├── NavBar.tsx          # Bottom navigation tabs
│   ├── FAB.tsx             # Floating action button
│   ├── MapPanel.tsx        # Main map view
│   ├── LoginView.tsx       # Authentication UI
│   ├── Wizard.tsx          # Trip creation wizard with AI
│   ├── ItineraryView.tsx   # Trip itinerary management
│   └── WalletView.tsx      # Expense tracking view
├── hooks/
│   ├── useAuth.ts          # Firebase authentication
│   ├── useTrip.ts          # Trip data management
│   └── useDebounce.ts      # Debounce utility
├── lib/
│   ├── api.ts              # AI, geocoding, weather, translation APIs
│   ├── firebase.ts         # Firebase configuration
│   └── utils.ts            # Helper functions
├── types/
│   └── index.ts            # TypeScript interfaces
├── App.tsx                 # Main application component
├── main.tsx                # Application entry point
└── index.css               # Global styles & Tailwind imports
```

## 🔐 Authentication

### Google Sign-in
- Uses Firebase Authentication with Google OAuth
- OAuth tokens are managed automatically by Firebase
- No manual JWT token handling required
- Supports both authenticated and guest (anonymous) sessions

### Firebase Security
- All data is automatically encrypted in transit
- Firestore rules can be configured for additional security
- Users can only access their own data by default

## 🤖 AI Integration

### How AI Works in TravelFlow

**1. Trip Planning (Wizard)**
- Uses Hugging Face Inference API to generate 3-day itineraries
- Falls back to a template itinerary if API is unavailable
- Automatically fetches coordinates for each location

**2. Location Recommendations (AI Travel Guide)**
- Provides hidden gem restaurant and activity suggestions
- Works with any location name, including complex international names
- Graceful fallback if API is rate-limited or unavailable

### Why Hugging Face?
- ✅ **Free tier available** (perfect for testing/personal projects)
- ✅ **Works globally** without VPN
- ✅ **No credit card required** for API token
- ✅ **Open source** model support
- 📈 **Scale when needed** with paid plans

### Alternative AI Providers
You can easily swap to other AI services:

**Google Gemini API** (Free tier + credits)
- Update API calls in `src/lib/api.ts`
- Set `VITE_GEMINI_API_KEY` in `.env.local`

**Anthropic Claude** (Requires paid API key)
- More advanced responses
- Higher rate limits
- Update `generateAIItinerary()` and `askAI()` functions

## 🌍 Location Support

### Enhanced Geocoding
- **Primary API**: Open-Meteo (Global coverage)
- **Fallback API**: Nominatim/OpenStreetMap (For complex names)

### Supported Location Names
- ✅ English: "Tokyo", "Shibuya Crossing"
- ✅ Japanese: "心斎橋" (Shinsaibashi), "浅草寺" (Asakusa Temple)
- ✅ Chinese: "故宮" (Forbidden City), "頤和園" (Summer Palace)
- ✅ Any international location name with proper spelling

### "Show in Globe" Feature
- Click any itinerary item to view it on an interactive map
- Automatically resolves complex place names
- Shows weather at the location (if available)
- Links to Google Maps for detailed directions

## 📱 Mobile & PWA

### Install as App
- Click the browser's "Install" button or menu option
- Or manually add to home screen
- Works offline with cached data

### Responsive Design
- Optimized for mobile, tablet, and desktop
- Touch-friendly UI with Phosphor icons
- Safe area support for notched devices

## 🚀 Deployment

### Deploy to Vercel (Recommended)
```bash
# One-click deployment from GitHub
# 1. Push code to GitHub
# 2. Connect GitHub repo to Vercel
# 3. Add environment variables in Vercel settings
# 4. Deploy automatically
```

### Deploy to Firebase Hosting
```bash
npm run build
firebase deploy
```

### Deploy to GitHub Pages
```bash
# Update vite.config.ts with base path
npm run build
# Push dist folder to gh-pages branch
```

## 🔧 Configuration Guide

### Firebase Setup (Step by Step)

1. **Create Firebase Project**
   - Go to https://console.firebase.google.com
   - Click "Add project"
   - Give it a name (e.g., "TravelFlow")
   - Click "Create project"

2. **Enable Authentication**
   - In Firebase Console, go to "Authentication" → "Sign-in method"
   - Enable "Google" provider
   - Enable "Anonymous" provider (for guest mode)

3. **Setup Firestore Database**
   - Go to "Firestore Database"
   - Click "Create database"
   - Start in test mode (for development)
   - Choose a location near your users

4. **Get Your Credentials**
   - Project Settings → Service Accounts
   - Copy your Firebase config values
   - Paste into `.env.local`

### Hugging Face Setup (Step by Step)

1. **Sign Up**
   - Go to https://huggingface.co/join
   - Create account (free)

2. **Create API Token**
   - Go to https://huggingface.co/settings/tokens
   - Click "New token"
   - Set token type to "Read"
   - Copy the token

3. **Add to Environment**
   - Paste token into `VITE_HF_API_KEY` in `.env.local`

## 📊 Data Structure

### Trip Object
```typescript
{
  settings: {
    destination: string;
    startDate: string;
    days: number;
    currencyCode: string;
    users: string[];
    targetLang: string;
  };
  itinerary: ItineraryItem[];
  expenses: Expense[];
}

### ItineraryItem
{
  id: number;
  dayIndex: number;
  time: string;
  location: string;
  note?: string;
  lat?: number;        // Auto-resolved from location name
  lon?: number;        // Auto-resolved from location name
  weather?: WeatherData;
}

### Expense
{
  id: number;
  amount: number;
  title: string;
  payer: string;
}
```

## 🐛 Troubleshooting

### "AI is currently unavailable"
- ✅ Check your Hugging Face API key in `.env.local`
- ✅ Verify you haven't hit rate limits (free tier has limits)
- ✅ Try using the fallback itinerary template
- ✅ Upgrade to Hugging Face Pro for higher limits

### "Location not found" on globe view
- ✅ Check spelling of location name
- ✅ Try using English names alongside local names
- ✅ Use "Open in Google Maps" to verify location exists
- ✅ Try a nearby major city if specific location can't be resolved

### Firebase not connecting
- ✅ Verify Firebase credentials in `.env.local`
- ✅ Check Firestore rules allow read/write in dev
- ✅ Ensure browser allows cookies/localStorage
- ✅ Try anonymous login if Google login fails

### Map tiles not loading
- ✅ Check internet connection
- ✅ Verify browser allows external images
- ✅ Try disabling ad blocker if using one
- ✅ Clear browser cache and reload

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## � Support

- 📧 Found a bug? Open an issue on GitHub
- 💡 Have a feature idea? Start a discussion
- 🎓 Need help setting up? Check the troubleshooting section above

---

**Built with ❤️ for travelers and wanderers everywhere**