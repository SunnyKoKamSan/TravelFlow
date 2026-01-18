# TravelFlow Pro 🌍✈️

**TravelFlow Pro** is a modern, AI-powered travel planning application designed to streamline your trips. Built with React, TypeScript, Node.js, and Firebase, it features interactive 3D visualizations, AI-generated itineraries using Google Gemini, and seamless cloud-based trip management.

- **🌐 Global Access**: Works anywhere without VPN requirement
- **🤖 AI-Powered**: Google Gemini API integration for intelligent trip planning
- **📱 Cross-Platform**: PWA-enabled, works on mobile and desktop
- **🐳 Docker Support**: Containerized backend for easy deployment

![React](https://img.shields.io/badge/React-18-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-5.0-purple?style=flat-square&logo=vite)
![Firebase](https://img.shields.io/badge/Firebase-10-orange?style=flat-square&logo=firebase)
![Node.js](https://img.shields.io/badge/Node.js-20-green?style=flat-square&logo=node.js)
![Docker](https://img.shields.io/badge/Docker-Enabled-blue?style=flat-square&logo=docker)

## ✨ Key Features

- **🤖 AI Trip Planner**: Generate complete, detailed day-by-day itineraries using Google Gemini AI with famous attractions, restaurants, and local experiences
- **🌍 Interactive 3D Globe**: Visualize your destinations on a stunning, interactive 3D globe with real-time location display
- **💰 Expense Tracker**: Seamless shared wallet to track expenses, split bills, and calculate balances between travelers
- **📍 Smart Mapping**: View your daily routes and locations on interactive Leaflet maps with automatic coordinate resolution
- **🔄 Real-time Sync**: All data is instantly synced across devices using Firebase Cloud Firestore
- **🗣️ Live Translator**: Built-in translation tools to help you communicate anywhere
- **📱 PWA Support**: Installable on mobile devices with offline capabilities
- **🎯 Location Recognition**: Supports complex location names including Japanese (心斎橋, 浅草寺), Chinese, and other international place names
- **🔄 Itinerary Refinement**: Refine AI-generated plans based on your feedback in natural language

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 + Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Maps & Visuals**: Three.js (3D Globe), Leaflet (Interactive Maps)
- **State Management**: React Hooks (Custom Hooks)

### Backend
- **Runtime**: Node.js 20
- **Framework**: Express.js
- **Language**: TypeScript
- **AI**: Google Gemini API
- **Geocoding**: Open-Meteo + Nominatim

### Infrastructure
- **Authentication**: Firebase Auth (Google, Anonymous)
- **Database**: Firebase Cloud Firestore
- **Deployment**: Docker + Docker Compose

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Docker & Docker Compose (optional, for containerized deployment)
- Firebase account (free tier eligible)
- Google Gemini API key (free tier available)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/SunnyKoKamSan/TravelFlow.git
   cd TravelFlow
   ```

2. **Install dependencies**

   Frontend:
   ```bash
   cd frontend
   npm install
   ```

   Backend:
   ```bash
   cd backend
   npm install
   ```

3. **Set up Firebase**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Create a new project
   - Enable Authentication (Google & Anonymous)
   - Enable Firestore Database
   - Get your Firebase config credentials

4. **Set up Google Gemini AI**
   - Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Create a new API key (free tier available)
   - Copy your API key

5. **Configure Environment Variables**

   Frontend `.env.local`:
   ```env
   # Firebase (Required)
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

   Backend `.env`:
   ```env
   NODE_ENV=development
   PORT=5000
   FRONTEND_URL=http://localhost:5173
   FIREBASE_PROJECT_ID=your_project_id
   GEMINI_API_KEY=your_gemini_api_key
   ```

6. **Run the application**

   Development mode:
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

   Or using Docker:
   ```bash
   docker-compose up --build
   ```

   Open [http://localhost:5173](http://localhost:5173) in your browser.

## 📜 Available Scripts

### Frontend
| Script | Description |
| --- | --- |
| `npm run dev` | Starts the development server with HMR |
| `npm run build` | Builds the app for production |
| `npm run lint` | Runs ESLint to check for code quality |
| `npm run preview` | Locally preview the production build |

### Backend
| Script | Description |
| --- | --- |
| `npm run dev` | Starts the development server with hot reload |
| `npm run build` | Compiles TypeScript to JavaScript |
| `npm start` | Runs the production build |
| `npm run lint` | Runs ESLint to check for code quality |

## 📂 Project Structure

```text
├── frontend/                # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── Globe.tsx          # 3D Globe visualization
│   │   │   ├── Header.tsx         # App header
│   │   │   ├── NavBar.tsx         # Navigation
│   │   │   ├── Wizard.tsx         # Trip creation with AI
│   │   │   ├── ItineraryView.tsx  # Trip management
│   │   │   └── WalletView.tsx     # Expense tracking
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # API clients & utilities
│   │   └── types/          # TypeScript types
│   └── package.json
│
├── backend/                 # Node.js backend
│   ├── src/
│   │   ├── routes/
│   │   │   └── ai.ts               # AI endpoints
│   │   ├── services/
│   │   │   ├── AITripPlannerService.ts   # Gemini integration
│   │   │   └── LocationService.ts        # Geocoding & weather
│   │   ├── config/                 # Configuration
│   │   ├── app.ts                  # Express app
│   │   └── index.ts                # Entry point
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml       # Docker orchestration
├── Makefile                 # Build commands
└── README.md
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

### Google Gemini API

**TravelFlow Pro** uses Google Gemini API for intelligent trip planning:

**Features:**
- **Generate Detailed Itineraries**: Creates day-by-day plans with famous attractions, restaurants, and local experiences
- **Smart Recommendations**: Suggests specific, well-known locations with descriptions, costs, and timing
- **Refine on Feedback**: Modify plans based on natural language requests (e.g., "More vegetarian options", "Less crowded places")
- **Location Search**: Find places and get detailed information including coordinates and weather

**API Endpoints:**
- `POST /api/ai/generate-itinerary` - Generate complete trip plan
- `POST /api/ai/refine-itinerary` - Refine existing plan with feedback
- `GET /api/ai/recommendations` - Get categorized recommendations (restaurants, attractions, events)
- `GET /api/ai/search-location` - Search for locations
- `GET /api/ai/location-info` - Get location details with weather

**Why Google Gemini?**
- ✅ **Free tier available** (perfect for personal projects)
- ✅ **Fast & reliable** responses
- ✅ **High quality** outputs with detailed information
- ✅ **Simple API** integration
- 📈 **Scale when needed** with flexible pricing

### Setup Instructions

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "Create API Key"
3. Copy your key and add to backend `.env`:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

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

### Deploy with Docker (Recommended)

**Build and run with Docker Compose:**
```bash
# Build and start services
docker-compose up --build

# Run in detached mode
docker-compose up -d

# Stop services
docker-compose down
```

**Manual Docker build:**
```bash
# Backend only
cd backend
docker build -t travelflow-backend .
docker run -p 5000:5000 --env-file .env travelflow-backend
```

### Deploy Frontend to Vercel
```bash
# 1. Push code to GitHub
# 2. Import project in Vercel
# 3. Set environment variables
# 4. Deploy automatically
```

### Deploy Frontend to Firebase Hosting
```bash
cd frontend
npm run build
firebase deploy
```

### Deploy Backend to Railway/Render
```bash
# 1. Connect GitHub repository
# 2. Set environment variables
# 3. Deploy from main branch
```

## 🔧 Configuration Guide

### Firebase Setup

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
   - Project Settings → General
   - Scroll to "Your apps" → Web app
   - Copy your Firebase config values
   - Paste into frontend `.env.local`

### Google Gemini Setup

1. **Get API Key**
   - Go to https://aistudio.google.com/app/apikey
   - Click "Create API Key"
   - Copy the generated key

2. **Add to Backend Environment**
   - Paste key into `GEMINI_API_KEY` in backend `.env`

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

### Backend not starting
- ✅ Check Node.js version (v16+ required)
- ✅ Verify `.env` file exists in backend folder
- ✅ Check `GEMINI_API_KEY` is set
- ✅ Run `npm install` to ensure dependencies are installed

### AI features not working
- ✅ Verify `GEMINI_API_KEY` in backend `.env`
- ✅ Check API key is valid at Google AI Studio
- ✅ Verify backend is running on port 5000
- ✅ Check browser console for CORS errors

### Frontend can't connect to backend
- ✅ Ensure backend is running on `http://localhost:5000`
- ✅ Check `VITE_API_URL` in frontend `.env.local` (if set)
- ✅ Verify CORS is configured correctly in backend
- ✅ Check firewall settings

### "Location not found" on globe view
- ✅ Check spelling of location name
- ✅ Try using English names alongside local names
- ✅ Use "Open in Google Maps" to verify location exists
- ✅ Try a nearby major city if specific location can't be resolved

### Firebase not connecting
- ✅ Verify Firebase credentials in frontend `.env.local`
- ✅ Check Firestore rules allow read/write in dev
- ✅ Ensure browser allows cookies/localStorage
- ✅ Try anonymous login if Google login fails

### Docker issues
- ✅ Ensure Docker Desktop is running
- ✅ Run `docker-compose down` then `docker-compose up --build`
- ✅ Check logs with `docker-compose logs backend`
- ✅ Verify `.env` file exists in project root

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