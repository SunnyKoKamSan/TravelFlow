# Firebase in this project

This project uses Firebase for core backend services (authentication, Firestore database, storage, and optional analytics).

What is Firebase?
- Firebase is a suite of backend services from Google for building web and mobile apps. Common Firebase products are Authentication, Firestore (NoSQL DB), Cloud Storage, Cloud Functions, and Analytics. It provides client SDKs so the frontend can communicate directly with these services.

What this project uses
- Authentication (`auth`) — sign in users (email/password, providers).
- Firestore (`db`) — store trips, itineraries, and other app data.
- Storage (`storage`) — upload user assets (photos, receipts).
- Analytics (`analytics`) — optional event collection (initialized only in browser).

Where the code is
- The Firebase initialization and exported services live in `src/lib/firebase.ts`.

Environment variables (recommended)
We prefer storing config in environment variables rather than committing them directly. For Vite, create a `.env.local` at the project root (`frontend/`) with keys prefixed by `VITE_`:

```
VITE_FIREBASE_API_KEY=AIzaSyA-lQH5jzN7Yl-EwnyYP0zpukpYHbifJJ0
VITE_FIREBASE_AUTH_DOMAIN=travelflow-93388.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=travelflow-93388
VITE_FIREBASE_STORAGE_BUCKET=travelflow-93388.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=935418035088
VITE_FIREBASE_APP_ID=1:935418035088:web:c74b42f9cce65f42015115
VITE_FIREBASE_MEASUREMENT_ID=G-PE771LVYLS
```

Note: Firebase config values (apiKey, projectId, etc.) are not secret like server credentials, but you should still avoid publishing them unnecessarily. Protect any server-side keys/service-account credentials and never commit private keys.

How to use the exported services
In your frontend components or hooks import what you need. Examples:

```ts
import app, { auth, db, storage, analytics } from '../lib/firebase';
// use `auth`, `db`, `storage` per Firebase SDK docs
```

Browser-only Analytics
- `analytics` is initialized only when `window` is available. In SSR or during unit tests it may be `undefined`.

Further steps / recommended
- Secure production usage with Firebase Security Rules (Firestore, Storage).
- Use Firebase Console to enable sign-in providers and review Analytics.
- For server-side admin tasks, use Firebase Admin SDK on a trusted server — do not use Admin SDK in client code.

If you want, I can also:
- Add `.env.example` to the repo (without sensitive values).
- Wire a minimal auth UI and show a sample Firestore read/write.
