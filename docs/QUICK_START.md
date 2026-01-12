# TravelFlow Pro - Quick Start Guide

## ⚡ 30-Minute Setup

### Step 1: Get API Keys (5 min)

**Google Gemini API (Required):**
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the key and save it

**Firebase (Required for Auth):**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable Authentication (Google & Anonymous)
4. Enable Firestore Database
5. Go to Project Settings and copy all credentials

### Step 2: Clone & Setup Frontend (10 min)

```bash
cd frontend
npm install

# Create .env.local
cat > .env.local << EOF
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
EOF

npm run dev
```

The frontend runs at **http://localhost:5173**

### Step 3: Setup Backend (10 min)

**Option A: With Docker (Recommended)**
```bash
cd ..
cat > backend/.env << EOF
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://admin:password@mongo:27017/travelflow?authSource=admin
GEMINI_API_KEY=your_gemini_api_key
FIREBASE_PROJECT_ID=your_project_id
FRONTEND_URL=http://localhost:5173
EOF

docker-compose up -d
```

**Option B: Without Docker**
```bash
cd backend
npm install

cat > .env << EOF
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/travelflow
GEMINI_API_KEY=your_gemini_api_key
FIREBASE_PROJECT_ID=your_project_id
FRONTEND_URL=http://localhost:5173
EOF

npm run dev
```

The backend API runs at **http://localhost:5000**

## ✅ Verify Everything Works

1. **Frontend:** http://localhost:5173 → Should load app
2. **Backend:** http://localhost:5000/health → Should return `{"status":"ok"}`
3. **Test AI:** 
   ```bash
   curl -X POST http://localhost:5000/api/ai/generate-itinerary \
     -H "Content-Type: application/json" \
     -d '{"destination":"Tokyo","days":3}'
   ```

## 🎯 Key Features to Try

1. **Generate AI Itinerary**
   - Enter destination (e.g., "Paris", "Tokyo", "New York")
   - AI generates detailed plans with famous attractions, restaurants, events
   - Get specific location names, not generic suggestions

2. **Refine Itinerary**
   - Provide feedback (e.g., "More vegetarian restaurants", "Focus on museums")
   - AI refines the plan based on your input

3. **Get Recommendations**
   - Search for specific categories (restaurants, attractions, events)
   - Get curated lists from local knowledge

4. **Expense Tracking**
   - Track shared expenses with friends
   - Automatically calculate who owes whom

5. **Interactive Maps**
   - View your itinerary on a map
   - See daily routes and locations

## 🐳 Docker Useful Commands

```bash
# See all services running
docker-compose ps

# View backend logs
docker-compose logs -f backend

# View MongoDB
docker-compose logs -f mongo

# Stop everything
docker-compose down

# Stop and remove data
docker-compose down -v

# Access MongoDB directly
docker-compose exec mongo mongosh -u admin -p password --authenticationDatabase admin
```

## 🔧 Troubleshooting

**Backend not connecting to MongoDB?**
- Make sure Docker is running: `docker ps`
- Check if service is up: `docker-compose logs mongo`
- Rebuild: `docker-compose down && docker-compose up -d`

**Frontend not calling backend?**
- Check `FRONTEND_URL` in backend `.env` matches your frontend URL
- Check CORS is enabled in backend
- Browser console for network errors

**AI API not working?**
- Verify `GEMINI_API_KEY` is set correctly
- Check API key has quota remaining
- Test endpoint directly: `curl http://localhost:5000/api/ai/generate-itinerary`

**MongoDB data not persisting?**
- Check volume: `docker volume ls`
- Ensure `mongo_data` volume exists

## 📚 Next Steps

- Read `ARCHITECTURE.md` for detailed structure
- Check `SETUP_GUIDE.md` for development guidelines
- See `README.md` for full feature documentation

## 🚀 Deploy to Production

**Frontend:** 
- Vercel: `vercel deploy`
- Netlify: `netlify deploy --prod`

**Backend:**
- Railway: Connect your GitHub repo
- Heroku: `git push heroku main`
- DigitalOcean: Docker deployment

**Database:**
- MongoDB Atlas: Create cloud cluster
- Update `MONGODB_URI` to Atlas connection string

---

Need help? Check the logs:
- Frontend errors: Browser DevTools (F12)
- Backend errors: `docker-compose logs -f backend`
- Database errors: `docker-compose logs -f mongo`
