# TravelFlow Pro - Restructured 🌍✈️

**TravelFlow Pro** is a modern, AI-powered travel planning application with a completely restructured architecture featuring separate frontend and backend services.

## 🎯 What's New in This Version

### ✨ Major Improvements

1. **Better Architecture**
   - ✅ Separated frontend and backend
   - ✅ Clean service-oriented design
   - ✅ MongoDB database with proper schema
   - ✅ Production-ready backend

2. **Enhanced AI Trip Planning**
   - ✅ Uses Google Gemini API (free tier available)
   - ✅ Generates detailed, specific itineraries
   - ✅ Includes famous attractions with context
   - ✅ Lists renowned restaurants with cuisine types
   - ✅ Shows local events and festivals
   - ✅ Provides practical travel tips
   - ✅ Refines plans based on user feedback

3. **Docker Support**
   - ✅ One-command setup: `docker-compose up`
   - ✅ MongoDB included in Docker
   - ✅ Hot-reload development
   - ✅ Production-ready containers

4. **Cleaner Organization**
   - ✅ Removed unnecessary files
   - ✅ Consolidated documentation
   - ✅ Clear folder structure
   - ✅ Better code organization

## 📂 Project Structure

```
frontend/                  # React + Vite frontend
├── src/
│   ├── components/       # UI components
│   ├── hooks/           # React hooks
│   ├── lib/             # API client, Firebase
│   └── types/           # TypeScript types
└── package.json

backend/                   # Express API server
├── src/
│   ├── config/          # Configuration
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API endpoints
│   └── services/        # Business logic
└── package.json

docker-compose.yml        # Docker setup
QUICK_START.md           # Quick start guide
ARCHITECTURE.md          # Detailed architecture
SETUP_GUIDE.md          # Complete setup guide
Makefile                # Convenient commands
```

## 🚀 Quick Start (5 Minutes)

### 1. Get API Keys
- **Gemini API**: [Google AI Studio](https://aistudio.google.com/app/apikey) (free)
- **Firebase**: [Firebase Console](https://console.firebase.google.com)

### 2. Setup Frontend
```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with Firebase credentials
npm run dev
```
Open http://localhost:5173

### 3. Setup Backend (with Docker)
```bash
cd ..
cp backend/.env.example backend/.env
# Edit backend/.env with API keys
docker-compose up -d
```
Backend at http://localhost:5000

### 4. Test It Works
```bash
curl http://localhost:5000/api/ai/generate-itinerary \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"destination":"Tokyo","days":3}'
```

**That's it!** Your app is running. 🎉

## 🤖 AI Features

### Generate Itineraries
Request:
```json
{
  "destination": "Paris",
  "days": 3,
  "interests": ["art", "food", "history"]
}
```

Response includes:
- ✅ Specific famous attractions (Eiffel Tower, Louvre, etc.)
- ✅ Renowned restaurants with cuisine types
- ✅ Local events happening
- ✅ Detailed day-by-day plan
- ✅ Travel tips and recommendations

### Refine Based on Feedback
Tell the AI: "More vegetarian restaurants, less crowded attractions"
→ Gets a new itinerary matching your preferences

### Get Recommendations
- 🍽️ Famous restaurants
- 🏛️ Iconic attractions
- 🎪 Local events
- 💡 Hidden gems

## 📚 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS |
| **Backend** | Node.js, Express, TypeScript |
| **Database** | MongoDB |
| **AI** | Google Gemini API |
| **Maps** | Leaflet, Three.js |
| **Auth** | Firebase |
| **DevOps** | Docker, Docker Compose |

## 🔧 Available Commands

```bash
# View all commands
make help

# Full setup
make setup

# Development
make dev           # Both frontend & backend
make dev-frontend  # Frontend only
make dev-backend   # Backend only

# Docker
make docker-up     # Start services
make docker-down   # Stop services
make docker-logs   # View logs

# Build & Deploy
make build         # Build frontend
make lint          # Run linting
```

Or without make:
```bash
# Frontend
cd frontend && npm run dev

# Backend (with Docker)
docker-compose up -d

# Backend (without Docker)
cd backend && npm run dev
```

## 📖 Documentation

- **[QUICK_START.md](./QUICK_START.md)** - Get started in 30 minutes
- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Complete setup with troubleshooting
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System design and structure

## 🌟 Key Features

- 🤖 **AI Trip Planning** - Detailed, specific itineraries
- 🌍 **Interactive 3D Globe** - Visualize destinations
- 💰 **Expense Tracker** - Split bills with friends
- 📍 **Smart Mapping** - View routes and locations
- 🔄 **Real-time Sync** - Firebase integration
- 📱 **PWA Support** - Works offline
- 🌐 **Global Access** - No VPN needed
- 🎯 **Personalization** - Customizable plans

## 🐳 Docker Cheat Sheet

```bash
# Start
docker-compose up -d

# View status
docker-compose ps

# View logs
docker-compose logs -f backend

# Stop
docker-compose down

# Stop and delete data
docker-compose down -v
```

## 🔗 API Endpoints

```
POST   /api/ai/generate-itinerary     - Generate AI itinerary
POST   /api/ai/refine-itinerary       - Refine based on feedback
GET    /api/ai/recommendations        - Get recommendations
GET    /api/ai/search-location        - Search locations
GET    /api/ai/location-info          - Get location details
GET    /health                         - Health check
```

## 📦 Environment Variables

### Frontend (.env.local)
```env
VITE_API_URL=http://localhost:5000
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### Backend (.env)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://admin:password@mongo:27017/travelflow
GEMINI_API_KEY=...
FIREBASE_PROJECT_ID=...
FRONTEND_URL=http://localhost:5173
```

## 🚀 Deployment

### Frontend
```bash
# Vercel
vercel deploy --prod

# Netlify
netlify deploy --prod
```

### Backend
- Railway, Heroku, DigitalOcean
- Use Docker image
- Set environment variables
- Connect MongoDB Atlas

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Frontend won't load | Check `VITE_API_URL` in `.env.local` |
| Backend not responding | Run `docker-compose logs backend` |
| MongoDB connection failed | Check Docker is running: `docker ps` |
| AI not working | Verify `GEMINI_API_KEY` in `.env` |
| Port already in use | Kill process: `lsof -i :5000` |

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed troubleshooting.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

See SETUP_GUIDE.md for development guidelines.

## 📄 License

MIT - See LICENSE file

## 🎓 Next Steps

1. ✅ Follow [QUICK_START.md](./QUICK_START.md)
2. 📖 Read [ARCHITECTURE.md](./ARCHITECTURE.md)
3. 🚀 Start building!

---

**Questions?** Check the logs or read the docs. You've got this! 🚀
