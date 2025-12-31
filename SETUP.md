# Setup Guide

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   Create a `.env` file in the root directory with your Firebase and API keys:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## What's Been Converted

✅ **Project Structure** - Complete React + Vite + TypeScript setup
✅ **TypeScript Types** - All interfaces and types defined
✅ **Firebase Configuration** - Auth and Firestore setup
✅ **API Utilities** - Geocoding, Weather, Translation, Gemini AI
✅ **React Hooks** - useAuth, useTrip, useDebounce
✅ **Core Components** - Globe, Map, UI components (Button, Card, Modal)
✅ **PWA Configuration** - Service worker and offline caching via vite-plugin-pwa
✅ **Styling** - Tailwind CSS with all original styles preserved
✅ **Main App Structure** - Basic routing and state management

## What Still Needs Implementation

The current `App.tsx` is a simplified version. The full application from the original HTML includes:

### Components to Build:
1. **Wizard Components** - Multi-step trip creation flow
2. **Itinerary View** - Full day-by-day itinerary with timeline
3. **Wallet/Expense View** - Detailed expense tracking with balances
4. **Map View** - Full-featured map with markers
5. **Modal Components**:
   - Itinerary Item Modal (Add/Edit)
   - Expense Modal
   - Settings Modal
   - Translator Modal
   - AI Assistant Modal
   - Globe/Location Modal
   - History/Trips Modal

### Features to Implement:
- Wizard step 1: Destination search with autocomplete
- Wizard step 2: Trip confirmation and AI generation
- Tab navigation (Itinerary, Wallet, Map)
- Day selector for itinerary
- Weather integration in itinerary items
- Real-time exchange rate conversion
- Full CRUD operations for itinerary and expenses
- User settings management
- Trip switching/history
- 3D Globe integration in header
- Map markers and user location

### Notes:
- The original HTML had inline Vue.js code - this has been converted to React patterns
- All API functions are in `src/lib/api.ts` and ready to use
- The `useTrip` hook manages all trip-related state and Firebase sync
- The `useAuth` hook handles authentication
- PWA support is configured and will generate service worker on build
- All styles from the original are preserved in `src/index.css`

## Next Steps

1. Build out the full component tree in `src/components/`
2. Implement the wizard flow components
3. Create the full dashboard with tabs
4. Add all modal components
5. Integrate Globe and Map components into views
6. Test Firebase sync
7. Test PWA functionality
8. Deploy to production

## Deployment

The app can be deployed to:
- **Vercel** (recommended): Connect GitHub repo, auto-deploy
- **Netlify**: Drag & drop `dist` folder or connect repo
- **GitHub Pages**: Build and push `dist` to `gh-pages` branch
- **Firebase Hosting**: `firebase deploy --only hosting`
