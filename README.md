<<<<<<< HEAD
# TravelFlow Pro

A modern travel planning application built with React + Vite + TypeScript. Plan your trips, manage expenses, and explore destinations with an interactive 3D globe.

## Features

- 🌍 **Interactive 3D Globe** - Visualize your travel destinations
- 📍 **Map Integration** - View itinerary items on interactive maps
- 💰 **Expense Tracking** - Split expenses among travelers
- 🤖 **AI Itinerary Generation** - Get AI-powered travel suggestions
- 🌐 **Multi-language Support** - Translate on the go
- 📱 **PWA Ready** - Works offline with service worker caching
- 🔄 **Real-time Sync** - Firebase integration for cloud sync

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Firebase** (Auth + Firestore)
- **Three.js** for 3D globe visualization
- **Leaflet** for 2D maps
- **Tailwind CSS** for styling
- **Vite PWA Plugin** for offline support

## Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Configure environment variables:**
Create a `.env` file in the root directory:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_GEMINI_API_KEY=your_gemini_api_key
```

3. **Run development server:**
```bash
npm run dev
```

4. **Build for production:**
```bash
npm run build
```

## Project Structure

```
src/
├── components/          # React components
│   ├── Globe.tsx       # Three.js 3D globe
│   ├── Map.tsx         # Leaflet map component
│   └── ui/             # UI components (Button, Card, Modal)
├── hooks/              # Custom React hooks
│   ├── useAuth.ts      # Firebase authentication
│   ├── useTrip.ts      # Trip data management
│   └── useDebounce.ts  # Debounce utility
├── lib/                # Utilities and configs
│   ├── firebase.ts     # Firebase configuration
│   ├── api.ts          # External API calls
│   └── utils.ts        # Helper functions
├── types/              # TypeScript type definitions
│   └── index.ts
├── App.tsx             # Main application component
├── main.tsx            # Entry point
└── index.css           # Global styles
```

## Deployment

The app is ready to be deployed to:
- **GitHub Pages** - Static hosting
- **Vercel** - Recommended for React apps
- **Netlify** - Easy deployment with CI/CD
- **Firebase Hosting** - Integrates with Firebase services

For GitHub Pages:
# TravelFlow Pro

A modern travel planning application built with React + Vite + TypeScript. Plan your trips, manage expenses, and explore destinations with an interactive 3D globe.

## Features

- 🌍 **Interactive 3D Globe** - Visualize your travel destinations
- 📍 **Map Integration** - View itinerary items on interactive maps
- 💰 **Expense Tracking** - Split expenses among travelers
- 🤖 **AI Itinerary Generation** - Get AI-powered travel suggestions
- 🌐 **Multi-language Support** - Translate on the go
- 📱 **PWA Ready** - Works offline with service worker caching
- 🔄 **Real-time Sync** - Firebase integration for cloud sync

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Firebase** (Auth + Firestore)
- **Three.js** for 3D globe visualization
- **Leaflet** for 2D maps
- **Tailwind CSS** for styling
- **Vite PWA Plugin** for offline support

## Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Configure environment variables:**
Create a `.env` file in the root directory:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_GEMINI_API_KEY=your_gemini_api_key
```

3. **Run development server:**
```bash
npm run dev
```

4. **Build for production:**
```bash
npm run build
```

## Project Structure

```
src/
├── components/          # React components
│   ├── Globe.tsx       # Three.js 3D globe
│   ├── Map.tsx         # Leaflet map component
│   └── ui/             # UI components (Button, Card, Modal)
├── hooks/              # Custom React hooks
│   ├── useAuth.ts      # Firebase authentication
│   ├── useTrip.ts      # Trip data management
│   └── useDebounce.ts  # Debounce utility
├── lib/                # Utilities and configs
│   ├── firebase.ts     # Firebase configuration
│   ├── api.ts          # External API calls
│   └── utils.ts        # Helper functions
├── types/              # TypeScript type definitions
│   └── index.ts
├── App.tsx             # Main application component
├── main.tsx            # Entry point
└── index.css           # Global styles
```

## Deployment

The app is ready to be deployed to:
- **GitHub Pages** - Static hosting
- **Vercel** - Recommended for React apps
- **Netlify** - Easy deployment with CI/CD
- **Firebase Hosting** - Integrates with Firebase services

For GitHub Pages:
1. Build the project: `npm run build`
2. Configure GitHub Pages to serve the `dist` folder
3. Update base path in `vite.config.ts` if needed

## License

MIT
