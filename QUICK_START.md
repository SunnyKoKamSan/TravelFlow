# TravelFlow Pro - Quick Start Card 🎯

## 🚀 Get Started in 5 Minutes

### Step 1: Clone & Install
```bash
git clone https://github.com/SunnyKoKamSan/TravelFlow.git
cd TravelFlow
npm install
```

### Step 2: Create `.env.local`
```bash
cp .env.example .env.local
```

### Step 3: Configure Firebase
1. Go to https://console.firebase.google.com
2. Create project → Enable Google Auth & Firestore
3. Get your credentials → Paste into `.env.local`

### Step 4: Configure AI (Optional)
1. Go to https://huggingface.co → Sign up free
2. Create API token → Paste into `VITE_HF_API_KEY`

### Step 5: Run
```bash
npm run dev
# Opens http://localhost:5173
```

---

## 📋 Environment Variables

Copy these into `.env.local` (from Firebase Console):

```env
# Firebase (Required)
VITE_FIREBASE_API_KEY=AIzaSyD...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc...

# AI (Optional but Recommended)
VITE_HF_API_KEY=hf_...
```

---

## 🎨 Key Features

- 🤖 **AI Trip Planner** - Generate 3-day itineraries
- 🌍 **Interactive Globe** - 3D destination visualization
- 📍 **Smart Maps** - Works with any location name (English, 日本語, 中文)
- 💰 **Expense Tracker** - Track shared costs
- 🗣️ **Translator** - Real-time translation
- 🔄 **Real-time Sync** - Firebase Firestore
- 📱 **PWA** - Install as app on mobile

---

## 🛠️ Commands

```bash
npm run dev         # Start dev server (http://localhost:5173)
npm run build       # Build for production
npm run lint        # Check code quality
npm run preview     # Preview production build
```

---

## 📚 Documentation

| File | Purpose |
|------|---------|
| **README.md** | Feature overview & user guide |
| **SETUP_GUIDE.md** | Step-by-step setup instructions |
| **DEVELOPER.md** | Developer quick reference |
| **IMPLEMENTATION_SUMMARY.md** | What was implemented |

---

## 🔑 Key Technologies

- React 18 + TypeScript
- Firebase (Auth + Firestore)
- Tailwind CSS
- Vite
- Leaflet (Maps)
- Three.js (3D)
- Hugging Face AI

---

## ✅ Testing Features

### Try These:
1. **Login** - Google OAuth or Guest mode
2. **Create Trip** - Enter destination + date
3. **AI Itinerary** - Generate 3-day plan
4. **Map View** - See all locations
5. **Show in Globe** - View specific location on map
6. **Ask AI** - Get recommendations
7. **Add Expense** - Track costs
8. **Real-time Sync** - Open in 2 tabs

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Firebase not connecting | Check `.env.local`, verify credentials |
| AI not working | Check `VITE_HF_API_KEY`, verify API token valid |
| Styles broken | Clear cache, restart `npm run dev` |
| Map not loading | Check internet, disable VPN |
| Location not found | Try English name or major city |

---

## 🚀 Deploy

### Vercel (Recommended)
1. Push to GitHub
2. Connect repo to Vercel
3. Add env vars
4. Deploy!

### Firebase Hosting
```bash
npm run build
firebase deploy
```

### GitHub Pages
```bash
npm run build
git subtree push --prefix dist origin gh-pages
```

---

## 📞 Need Help?

1. Check **SETUP_GUIDE.md** for detailed steps
2. Read **README.md** for features & troubleshooting
3. Check browser console: `F12` → Console tab
4. Open issue on GitHub

---

## ⚡ Pro Tips

- 🚀 Use Vercel for easiest deployment
- 💾 `.env.local` never gets committed (see `.gitignore`)
- 🔑 Keep API keys private!
- 📈 Monitor Firebase usage (free tier has limits)
- 🎨 Edit Tailwind config for custom colors
- 🐳 Use Docker for consistent environments

---

## 📱 Mobile Testing

```bash
# Get your local IP
ipconfig getifaddr en0          # macOS
hostname -I                     # Linux
ipconfig                        # Windows

# In mobile browser, visit:
http://YOUR_IP:5173
```

---

## 🎓 First Deployment Checklist

- [ ] All env vars in `.env.local`
- [ ] `npm run build` succeeds
- [ ] Tested all features locally
- [ ] Firebase project created
- [ ] Google OAuth configured
- [ ] Pushed to GitHub
- [ ] Connected to Vercel/Firebase
- [ ] Tested production deployment

---

## 💡 Next Ideas

- Add photo uploads
- Collaborative planning
- Social sharing
- Mobile app (React Native)
- Advanced AI (Claude/GPT-4)
- Hotel/flight bookings
- Analytics

---

## 🎉 You're Ready!

TravelFlow Pro is production-ready. All code is in GitHub and ready to deploy.

**Happy traveling! 🌍✈️**

Questions? Check the docs or open an issue on GitHub.
