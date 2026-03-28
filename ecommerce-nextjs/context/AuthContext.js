'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Fetch Firestore profile
        try {
          const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (snap.exists()) {
            setUserProfile(snap.data());
          } else {
            setUserProfile({ name: firebaseUser.displayName || '', email: firebaseUser.email });
          }
        } catch (e) {
          setUserProfile({ name: firebaseUser.displayName || '', email: firebaseUser.email });
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setUserProfile(null);
  };

  const refreshProfile = async () => {
    if (!user) return;
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) setUserProfile(snap.data());
    } catch (e) { /* ignore */ }
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
