// lib/firebase.js
// Replace the firebaseConfig values below with your own Firebase project credentials.
// You can find them in: Firebase Console > Project Settings > General > Your apps

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyD5p-7Cgep9aGf6omMXDH8LOTy0C76jJaQ",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "e-commerce-shop-24.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "e-commerce-shop-24",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "e-commerce-shop-24.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1000897291264",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1000897291264:web:4f1e78554c3e69d310a4e5",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
export default app;
