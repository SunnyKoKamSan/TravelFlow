# TravelFlow Pro - Complete Setup Guide 🚀

This guide will walk you through setting up TravelFlow Pro from scratch, including all required configurations.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Step-by-Step Installation](#step-by-step-installation)
3. [Firebase Setup](#firebase-setup)
4. [AI Integration (Hugging Face)](#ai-integration-hugging-face)
5. [Running the App](#running-the-app)
6. [Troubleshooting](#troubleshooting)
7. [Deployment](#deployment)

---

## Prerequisites

Before starting, ensure you have:

- **Node.js** v16 or higher ([Download](https://nodejs.org))
- **npm** (comes with Node.js) or **yarn**
- **Git** ([Download](https://git-scm.com))
- A **Firebase Account** (free tier available)
- A **Hugging Face Account** (free tier available)

**Check your installations:**
```bash
node --version   # Should be v16+
npm --version    # Should be v7+
git --version    # Should be installed
```

---

## Step-by-Step Installation

### 1. Clone the Repository

```bash
git clone https://github.com/SunnyKoKamSan/TravelFlow.git
cd TravelFlow
```

### 2. Install Dependencies

```bash
npm install
```

This installs all required packages including:
- React, Vite, TypeScript
- Firebase SDK
- Tailwind CSS
- Leaflet (maps)
- Three.js (3D globe)
- And more...

### 3. Create Environment File

```bash
# Copy the example file
cp .env.example .env.local
```

**Important:** Never commit `.env.local` to Git! It contains secrets and is already in `.gitignore`.

---

## Firebase Setup

### Why Firebase?
- **Free tier** includes Auth and Firestore (up to 1M reads/writes/deletes per day)
- **Automatic synchronization** across devices
- **Built-in security rules** for protecting user data
- **No backend server** needed to manage

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **"Add Project"**
3. Enter project name (e.g., "TravelFlow")
4. Uncheck "Enable Google Analytics" (optional)
5. Click **"Create Project"** and wait

### Step 2: Enable Authentication

1. In Firebase Console, go to **"Authentication"** (left sidebar)
2. Click **"Get Started"**
3. Click **"Sign-in method"** tab
4. **Enable Google:**
   - Click on "Google"
   - Toggle the switch ON
   - Choose an email to show as support
   - Click **"Save"**
5. **Enable Anonymous:**
   - Click on "Anonymous"
   - Toggle the switch ON
   - Click **"Save"**

### Step 3: Create Firestore Database

1. In Firebase Console, go to **"Firestore Database"** (left sidebar)
2. Click **"Create Database"**
3. Choose region closest to your users (e.g., "us-central1")
4. Select **"Start in test mode"** (for development)
   - ⚠️ **Important for Production:** Use security rules to restrict access later
5. Click **"Create"** and wait

### Step 4: Get Your Firebase Credentials

1. Click the **Settings icon** ⚙️ in top-right
2. Click **"Project Settings"**
3. Scroll down to **"Your apps"** section
4. Click the **Web icon** (looks like `</>`)
5. Enter app nickname (e.g., "TravelFlow Web")
6. Click **"Register App"**
7. Copy the Firebase config object

**You'll see something like:**
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxx",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcd1234efgh5678"
};
```

### Step 5: Add to `.env.local`

```env
VITE_FIREBASE_API_KEY=AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcd1234efgh5678
```

---

## AI Integration (Hugging Face)

### Why Hugging Face?
- ✅ **Free tier** perfect for personal/testing
- ✅ **Global access** - works everywhere without VPN
- ✅ **No credit card** required to get started
- ✅ **Open-source models** available
- 📈 **Scale easily** to paid tier when needed

### How It Works
- Generates AI travel itineraries when you create a trip
- Provides location recommendations and hidden gems
- Falls back gracefully if API is unavailable

### Step 1: Sign Up for Hugging Face

1. Go to [Hugging Face](https://huggingface.co)
2. Click **"Sign Up"**
3. Create account (free)
4. Verify email

### Step 2: Create API Token

1. Log in to Hugging Face
2. Click your **profile picture** → **"Settings"**
3. Go to **"Access Tokens"** (left sidebar)
4. Click **"New token"**
5. Choose settings:
   - Name: "TravelFlow"
   - Type: **"Read"**
6. Click **"Generate token"**
7. **Copy the token** (you won't see it again!)

### Step 3: Add to `.env.local`

```env
VITE_HF_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Testing AI Setup

Run the app and try:
1. Create a new trip with a destination
2. Click "Generate with AI" button
3. Should generate a 3-day itinerary

**If it fails:**
- Check your HF_API_KEY is correct
- Check your internet connection
- Try again (free tier has rate limits)
- The app will use a fallback template

---

## Running the App

### Development Server

```bash
npm run dev
```

**Output:**
```
  VITE v5.0.0  ready in 234 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
```

Creates optimized production build in `dist/` folder.

### Lint Code

```bash
npm run lint
```

Checks code quality with ESLint.

---

## Troubleshooting

### "Firebase credentials missing"
**Solution:**
- Check `.env.local` exists
- Verify all `VITE_FIREBASE_*` variables are filled
- Restart dev server: `npm run dev`

### "Google Sign-In not working"
**Solution:**
- Verify Google auth is enabled in Firebase Console
- Check browser console for error messages
- Try signing in with a different Google account
- Clear cookies/cache and try again

### "AI features not working"
**Solution:**
- Check `VITE_HF_API_KEY` is set correctly in `.env.local`
- Verify Hugging Face account is active
- Check if free tier rate limit reached (limit: ~300 requests/month)
- Restart dev server
- Try Claude or Gemini as alternative (see README)

### "Location not found on map"
**Solution:**
- Try using English spelling: "Tokyo" instead of "東京"
- Use major city names for better results
- Try a nearby city if specific location can't resolve
- Check browser console for geocoding errors

### "Map tiles not loading"
**Solution:**
- Check internet connection
- Disable VPN/proxy if using one
- Clear browser cache
- Try a different browser
- Disable ad blockers

### "Can't connect to Firestore"
**Solution:**
- Verify internet connection
- Check Firebase project is created and active
- Verify `projectId` is correct in `.env.local`
- Check Firestore database exists and is in test mode
- Go to Firebase Console → Firestore → Rules and ensure it allows reads/writes

---

## Deployment

### Deploy to Vercel (Easiest)

1. **Push code to GitHub:**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Connect to Vercel:**
   - Go to [Vercel](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repo
   - Click "Import"

3. **Add Environment Variables:**
   - In Vercel, go to Settings → Environment Variables
   - Add all variables from `.env.local`:
     - `VITE_FIREBASE_API_KEY`
     - `VITE_FIREBASE_AUTH_DOMAIN`
     - etc.
   - Click "Save"

4. **Deploy:**
   - Vercel will automatically deploy when you push to GitHub

### Deploy to Firebase Hosting

1. **Install Firebase CLI:**
   ```bash
   npm install -g firebase-tools
   ```

2. **Build the app:**
   ```bash
   npm run build
   ```

3. **Initialize Firebase Hosting:**
   ```bash
   firebase login
   firebase init hosting
   ```
   - When asked about public directory, enter `dist`

4. **Deploy:**
   ```bash
   firebase deploy
   ```

### Deploy to GitHub Pages

1. **Update `vite.config.ts`:**
   ```typescript
   export default {
     base: '/TravelFlow/',
     // ... other config
   }
   ```

2. **Build and deploy:**
   ```bash
   npm run build
   git add dist
   git commit -m "Build for GitHub Pages"
   git subtree push --prefix dist origin gh-pages
   ```

3. **Enable in GitHub:**
   - Go to repo Settings → Pages
   - Set source to "gh-pages" branch

---

## Environment Variables Reference

| Variable | Required | Source | Example |
|----------|----------|--------|---------|
| `VITE_FIREBASE_API_KEY` | ✅ Yes | Firebase Console | `AIzaSy...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | ✅ Yes | Firebase Console | `myapp.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | ✅ Yes | Firebase Console | `myapp-12345` |
| `VITE_FIREBASE_STORAGE_BUCKET` | ✅ Yes | Firebase Console | `myapp-12345.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ✅ Yes | Firebase Console | `123456789` |
| `VITE_FIREBASE_APP_ID` | ✅ Yes | Firebase Console | `1:123456789:web:abc...` |
| `VITE_HF_API_KEY` | ⚠️ Optional* | Hugging Face | `hf_...` |

*Optional but recommended for AI features. App will work without it using fallback itineraries.

---

## Next Steps

1. ✅ Setup complete!
2. 🚀 Run `npm run dev` and start using TravelFlow
3. 📱 Try the "Create Trip" feature
4. 🤖 Test AI itinerary generation
5. 🗺️ Add locations and view on map
6. 🌍 Click "Show in Globe" to visualize locations

---

## Need Help?

- 📖 Check [README.md](./README.md) for feature overview
- 🐛 Open an issue on GitHub
- 💬 Check browser console for error messages (F12)
- 🔍 Search Firebase docs: https://firebase.google.com/docs

---

**Happy traveling! 🌍✈️**
