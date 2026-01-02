
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db } from '../services/firebase';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    if (!email || !password) {
        setError('ইমেইল ও পাসওয়ার্ড দিন।');
        return;
    }
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const userSnap = await getDoc(doc(db, 'users', cred.user.uid));
      if (userSnap.exists() && userSnap.data().status === 'blocked') {
        await auth.signOut();
        setError('আপনার অ্যাকাউন্টটি ব্লক করা হয়েছে।');
      } else {
        navigate('/');
      }
    } catch (e: any) {
      console.error(e);
      let msg = "ইমেইল অথবা পাসওয়ার্ড ভুল।";
      if (e.code === 'auth/user-not-found') msg = "এই ইমেইলে কোনো অ্যাকাউন্ট পাওয়া যায়নি।";
      else if (e.code === 'auth/wrong-password') msg = "ভুল পাসওয়ার্ড।";
      setError(msg);
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);

      if (!snap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          name: user.displayName || 'Google User',
          email: user.email,
          profileId: `GS-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          walletBalance: 0,
          status: 'active',
          photoURL: user.photoURL,
          createdAt: serverTimestamp()
        });
      }
      navigate('/');
    } catch (e: any) {
      console.error(e);
      setError("গুগল দিয়ে লগইন করতে সমস্যা হয়েছে।");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#F5F5F7] dark:bg-black transition-colors duration-300">
      <div className="w-full space-y-8 animate-fadeIn max-w-md">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-black text-[#7B61FF] tracking-tighter">Vercel Top Up</h1>
        </div>

        <div className="bg-white dark:bg-[#1C1C1E] p-8 rounded-[2rem] shadow-xl border border-black/5 dark:border-white/5 space-y-6">
          <h2 className="text-2xl font-extrabold text-center tracking-tight">স্বাগতম</h2>
          
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-xl text-red-600 dark:text-red-400 text-sm font-bold animate-shake text-center">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="আপনার ইমেইল" 
                className="w-full bg-[#F5F5F7] dark:bg-black p-5 rounded-2xl outline-none focus:ring-2 focus:ring-[#7B61FF] transition-all" 
              />
            </div>
            <div className="relative">
              <input 
                type={showPass ? 'text' : 'password'} 
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="আপনার পাসওয়ার্ড" 
                className="w-full bg-[#F5F5F7] dark:bg-black p-5 rounded-2xl outline-none focus:ring-2 focus:ring-[#7B61FF] transition-all" 
              />
              <i 
                className={`fa-solid ${showPass ? 'fa-eye-slash' : 'fa-eye'} absolute top-1/2 -translate-y-1/2 right-5 text-gray-400 cursor-pointer`}
                onClick={() => setShowPass(!showPass)}
              ></i>
            </div>
          </div>

          <div className="flex justify-end">
            <Link to="/forgot-password" size="sm" className="text-xs font-bold text-[#7B61FF] hover:underline">পাসওয়ার্ড ভুলে গেছেন?</Link>
          </div>

          <button 
            disabled={loading}
            onClick={handleLogin}
            className="w-full bg-[#7B61FF] text-white p-5 rounded-2xl font-bold shadow-lg shadow-[#7B61FF4D] active:scale-95 transition-transform disabled:opacity-50"
          >
            {loading ? 'অপেক্ষা করুন...' : 'লগ ইন'}
          </button>

          <div className="relative flex items-center justify-center py-2">
            <div className="absolute w-full border-t border-black/5 dark:border-white/5"></div>
            <span className="relative bg-white dark:bg-[#1C1C1E] px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">অথবা</span>
          </div>

          <button 
            onClick={handleGoogle}
            className="w-full bg-white dark:bg-black border border-gray-200 dark:border-white/10 p-4 rounded-2xl flex items-center justify-center gap-3 font-bold text-sm active:scale-95 transition-transform shadow-sm"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" className="w-5 h-5" />
            Sign in with Google
          </button>

          <p className="text-center text-sm font-medium text-gray-500">
            অ্যাকাউন্ট নেই? <Link to="/signup" className="text-[#7B61FF] font-bold">সাইন আপ করুন</Link>
          </p>
        </div>
        
        <div className="text-center">
          <Link to="/" className="text-xs font-bold text-gray-400">গেস্ট হিসেবে ফিরে যান</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
