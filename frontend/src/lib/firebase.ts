import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyA-lQH5jzN7Yl-EwnyYP0zpukpYHbifJJ0",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "travelflow-93388.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "travelflow-93388",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "travelflow-93388.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "935418035088",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:935418035088:web:c74b42f9cce65f42015115",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-PE771LVYLS"
};

const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Analytics only works in the browser. Guard it so SSR / tests don't break.
let analytics: ReturnType<typeof getAnalytics> | undefined = undefined;
try {
  if (typeof window !== 'undefined') {
    analytics = getAnalytics(app);
  }
} catch (e) {
  // If analytics fails to initialize (e.g., in non-browser env), just ignore.
  analytics = undefined;
}

export { analytics };
export default app;

// Re-export types/helpers for provider logins
export { GoogleAuthProvider, OAuthProvider } from 'firebase/auth';
