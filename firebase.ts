
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCZrkWD_5YQW0P-3SYhAzSE4pbCyTqvYu8",
  authDomain: "topupshopnur.firebaseapp.com",
  projectId: "topupshopnur",
  storageBucket: "topupshopnur.firebasestorage.app",
  messagingSenderId: "25262245834",
  appId: "1:25262245834:web:5a867f0516b120bfbcb133",
  measurementId: "G-QR5PYZDCG8"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
