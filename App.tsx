
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './services/firebase';
import { UserData } from './types';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Wallet from './pages/Wallet';
import AddMoney from './pages/AddMoney';
import Topup from './pages/Topup';
import Orders from './pages/Orders';
import Profile from './pages/Profile';
import OrderConfirmation from './pages/OrderConfirmation';
import PaymentGateway from './pages/PaymentGateway';
import AdminPaymentMethods from './pages/AdminPaymentMethods';
import AdminVouchers from './pages/AdminVouchers';
import Wishlist from './pages/Wishlist';

// Components
import Layout from './components/Layout';

const ProtectedRoute = ({ user, children, adminOnly = false }: { user: UserData | null; children?: React.ReactNode; adminOnly?: boolean }) => {
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
};

const App: React.FC = () => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('theme') === 'dark-mode');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setUser({ id: userDoc.id, ...userDoc.data() } as any);
        } else {
          setUser({
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || 'User',
            email: firebaseUser.email || '',
            profileId: '',
            walletBalance: 0,
            status: 'active',
            role: 'user',
            photoURL: firebaseUser.photoURL || 'https://i.ibb.co/74CkxSP/avatar.png'
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode', 'bg-[#000000]', 'text-white');
      document.body.classList.remove('bg-[#F5F5F7]');
      localStorage.setItem('theme', 'dark-mode');
    } else {
      document.body.classList.remove('dark-mode', 'bg-[#000000]');
      document.body.classList.add('bg-[#1a1a1c]', 'text-white');
      localStorage.setItem('theme', 'light-mode');
    }
  }, [isDarkMode]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#1a1a1c]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#7B61FF]"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen relative overflow-x-hidden text-white">
        <Routes>
          <Route path="/" element={<Layout isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode}><Home /></Layout>} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/topup" element={<Layout isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode}><Topup /></Layout>} />
          <Route path="/wallet" element={<ProtectedRoute user={user}><Layout isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode}><Wallet /></Layout></ProtectedRoute>} />
          <Route path="/add-money" element={<ProtectedRoute user={user}><Layout isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode}><AddMoney /></Layout></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute user={user}><Layout isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode}><Orders /></Layout></ProtectedRoute>} />
          <Route path="/wishlist" element={<ProtectedRoute user={user}><Layout isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode}><Wishlist /></Layout></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute user={user}><Layout isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode}><Profile isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} /></Layout></ProtectedRoute>} />
          <Route path="/order-confirmation" element={<ProtectedRoute user={user}><Layout isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode}><OrderConfirmation /></Layout></ProtectedRoute>} />
          <Route path="/payment-gateway" element={<ProtectedRoute user={user}><PaymentGateway /></ProtectedRoute>} />
          
          {/* Admin Routes */}
          <Route path="/admin/payment-methods" element={<ProtectedRoute user={user} adminOnly><Layout isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode}><AdminPaymentMethods /></Layout></ProtectedRoute>} />
          <Route path="/admin/vouchers" element={<ProtectedRoute user={user} adminOnly><Layout isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode}><AdminVouchers /></Layout></ProtectedRoute>} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
