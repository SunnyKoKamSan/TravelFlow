import { useCallback, useEffect, useState } from 'react';
import {
  User,
  signInAnonymously,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserSessionPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const ensureUserProfile = useCallback(async (u: User) => {
    if (!u || u.isAnonymous) return;
    if (!db) return;

    const providerId = u.providerData?.[0]?.providerId;

    await setDoc(
      doc(db, 'users', u.uid, 'profile', 'public'),
      {
        uid: u.uid,
        email: u.email ?? null,
        displayName: u.displayName ?? null,
        photoURL: u.photoURL ?? null,
        providerId: providerId ?? null,
        lastLoginAt: serverTimestamp(),
      },
      { merge: true }
    );
  }, []);

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
      const cred = await signInWithPopup(auth, provider);
      await ensureUserProfile(cred.user);
    } catch (e: any) {
      throw new Error(`Login failed: ${e.message}`);
    }
  };

  const loginApple = async () => {
    try {
      await setPersistence(auth, browserLocalPersistence);
      // Apple Sign-In uses OAuthProvider('apple.com') in Firebase Web SDK
      const provider = new OAuthProvider('apple.com');
      // Optional scopes
      provider.addScope('email');
      provider.addScope('name');

      const cred = await signInWithPopup(auth, provider);
      await ensureUserProfile(cred.user);
    } catch (e: any) {
      throw new Error(`Apple login failed: ${e.message}`);
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
    sessionStorage.removeItem('travelFlowData_guest');
    await signOut(auth);
  };

  return {
    user,
    loading,
    loginGoogle,
    loginApple,
    loginAnonymously,
    logout,
  };
}
