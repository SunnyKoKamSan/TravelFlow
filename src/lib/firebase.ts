import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "請在此填入您的 API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "請在此填入您的 PROJECT_ID.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "請在此填入您的 PROJECT_ID",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "請在此填入您的 PROJECT_ID.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "請在此填入您的 SENDER_ID",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "請在此填入您的 APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
