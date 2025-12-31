import { useEffect, useState } from 'react';
import {
  User,
  signInAnonymously,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserSessionPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loginGoogle = async () => {
    try {
      await setPersistence(auth, browserLocalPersistence);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e: any) {
      throw new Error(`Login failed: ${e.message}`);
    }
  };

  const loginAnonymously = async () => {
    try {
      await setPersistence(auth, browserSessionPersistence);
      await signInAnonymously(auth);
    } catch (e: any) {
      console.warn('Offline fallback', e);
      // Create guest user object
      const guestUser = {
        uid: 'guest',
        email: 'Guest',
        isAnonymous: true,
      } as User;
      setUser(guestUser);
      throw e; // Re-throw to handle in component
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return {
    user,
    loading,
    loginGoogle,
    loginAnonymously,
    logout,
  };
}
