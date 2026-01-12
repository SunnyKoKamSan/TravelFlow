# TravelFlow Pro - Restructured Architecture 🚀

## 📂 Project Structure

```
Project1 v2 - Restructured/
├── frontend/                 # React + Vite frontend
│   ├── src/
│   │   ├── components/       # Reusable React components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utilities and API calls
│   │   ├── types/           # TypeScript interfaces
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/              # Static assets
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                  # Node.js/Express API server
│   ├── src/
│   │   ├── config/          # Configuration files
│   │   ├── models/          # MongoDB schemas
│   │   ├── routes/          # API route handlers
│   │   ├── services/        # Business logic
│   │   │   ├── AITripPlannerService.ts    # Enhanced AI prompts
│   │   │   ├── LocationService.ts         # Location/geocoding
│   │   │   └── AuthService.ts             # Authentication
│   │   ├── middleware/      # Express middleware
│   │   ├── app.ts           # Express app setup
│   │   └── index.ts         # Server entry point
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── docker-compose.yml        # Docker compose for backend + MongoDB
├── .config/                  # Configuration templates
├── README.md                 # Main documentation
├── SETUP_GUIDE.md           # Setup instructions
└── LICENSE

```

## 🎯 Key Improvements

### 1. **Better Separation of Concerns**
- **Frontend**: UI/UX, user interactions, real-time updates
- **Backend**: Business logic, AI processing, database operations
- **Database**: Persistent storage with proper schema

### 2. **Enhanced AI Trip Planning**
The backend now uses **Google Gemini API** with an improved prompt that generates:
- **Specific famous attractions** with historical context
- **Renowned restaurants** with cuisine types
- **Local events & festivals** for the season
- **Detailed activity descriptions** including costs, duration, and reservations
- **Hidden gems** and local experiences
- **Practical travel tips**

**New AI Capabilities:**
- ✅ Generate detailed 1-365 day itineraries
- ✅ Refine itineraries based on user feedback
- ✅ Get recommendations by category (restaurants, attractions, events)
- ✅ Personalized suggestions based on interests

### 3. **Clean File Organization**
Removed:
- ❌ Empty `api/` folder
- ❌ Redundant documentation files
- ❌ Unnecessary configuration duplicates

Organized into:
- ✅ Clear frontend and backend separation
- ✅ Service-oriented backend architecture
- ✅ Consolidated documentation

### 4. **Docker Support**
- Easy local development with `docker-compose`
- MongoDB container for database
- Backend container with hot-reload
- Production-ready Dockerfile included

### 5. **Database Schema**
**MongoDB Collections:**
- `trips`: Trip metadata and settings
- `itineraries`: Daily itinerary items with coordinates
- `expenses`: Expense tracking with splits
- Proper indexing for efficient querying

## 🚀 Quick Start

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with your Firebase credentials
npm run dev
# Opens at http://localhost:5173
```

### Backend Setup (with Docker)
```bash
cd ..
cp backend/.env.example backend/.env
# Edit backend/.env with your API keys

docker-compose up -d
# Backend runs at http://localhost:5000
# MongoDB runs at localhost:27017
```

### Backend Setup (without Docker)
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your API keys
npm run dev
# Backend runs at http://localhost:5000
```

## 📝 Environment Variables

### Frontend (.env.local)
```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
```

### Backend (.env)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://admin:password@localhost:27017/travelflow
GEMINI_API_KEY=...
FRONTEND_URL=http://localhost:5173
```

## 🤖 AI Integration

### Current: Google Gemini (Recommended)
- Free tier available
- No credit card required
- Works globally
- Excellent multi-language support

### Optional: Anthropic Claude
- More advanced reasoning
- Better at complex refinements
- Paid subscription required

## 📚 API Endpoints

### AI & Trip Planning
- `POST /api/ai/generate-itinerary` - Generate AI itinerary
- `POST /api/ai/refine-itinerary` - Refine based on feedback
- `GET /api/ai/recommendations` - Get location recommendations
- `GET /api/ai/search-location` - Search locations
- `GET /api/ai/location-info` - Get coordinates, weather, country info

## 🔄 Frontend to Backend Integration

Update frontend API calls in `lib/api.ts`:

```typescript
// Instead of:
// const prompt = `Generate a 3-day itinerary for ${destination}...`;
// const response = await fetch('https://api-inference.huggingface.co/...');

// Use:
const response = await fetch('http://localhost:5000/api/ai/generate-itinerary', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ destination, days, interests })
});
```

## 🐳 Docker Commands

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f mongo

# Stop services
docker-compose down

# Rebuild images
docker-compose build --no-cache

# Access MongoDB shell
docker-compose exec mongo mongosh -u admin -p password --authenticationDatabase admin
```

## 📦 Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite (Lightning-fast builds)
- Tailwind CSS
- Leaflet (Maps)
- Three.js (3D Globe)
- Firebase (Auth & Firestore)

**Backend:**
- Node.js + Express
- TypeScript
- MongoDB
- Google Gemini AI
- Axios (HTTP client)

**DevOps:**
- Docker & Docker Compose
- MongoDB in container
- Hot-reload development

## 🎓 Next Steps

1. **Set up API Keys:**
   - Get Gemini API key from [Google AI Studio](https://aistudio.google.com)
   - Keep Firebase credentials in `.env.local`

2. **Start Development:**
   - Terminal 1: `cd frontend && npm run dev`
   - Terminal 2: `docker-compose up -d` or `cd backend && npm run dev`

3. **Test AI Features:**
   - Use the `/api/ai/generate-itinerary` endpoint
   - Refine with user feedback
   - Get location-specific recommendations

4. **Deploy:**
   - Frontend: Vercel, Netlify, or GitHub Pages
   - Backend: Railway, Heroku, or your own server
   - Database: MongoDB Atlas (cloud)

## 🤝 Contributing

See SETUP_GUIDE.md for development guidelines.

## 📄 License

MIT - See LICENSE file
