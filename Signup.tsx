
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db } from '../services/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, collection, query, where, getDocs, runTransaction } from 'firebase/firestore';

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralInput, setReferralInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const REFERRAL_BONUS_NEW_USER = 5; // Reward for the person signing up
  const REFERRAL_BONUS_REFERRER = 10; // Reward for the person who shared the code

  const handleSignup = async () => {
    setError(null);
    if (!name || !email || !password) {
        setError('সব তথ্য পূরণ করুন।');
        return;
    }
    if (password.length < 6) {
        setError('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
        return;
    }

    setLoading(true);
    try {
      let referrerUid = null;

      // 1. Validate Referral Code if provided
      if (referralInput.trim()) {
        const q = query(collection(db, 'users'), where('referralCode', '==', referralInput.trim().toUpperCase()));
        const snap = await getDocs(q);
        if (!snap.empty) {
          referrerUid = snap.docs[0].id;
        } else {
          setError('ভুল রেফারেল কোড! অনুগ্রহ করে সঠিক কোড দিন অথবা ঘরটি খালি রাখুন।');
          setLoading(false);
          return;
        }
      }

      // 2. Create Auth User
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const newUserUid = cred.user.uid;
      const myReferralCode = `TOPUP-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

      // 3. Transactional setup for bonuses
      await runTransaction(db, async (transaction) => {
        const newUserRef = doc(db, 'users', newUserUid);
        
        let startingBalance = 0;

        if (referrerUid) {
          const referrerRef = doc(db, 'users', referrerUid);
          const referrerSnap = await transaction.get(referrerRef);
          
          if (referrerSnap.exists()) {
            const currentReferrerBalance = referrerSnap.data().walletBalance || 0;
            const currentReferralCount = referrerSnap.data().referralCount || 0;
            
            // Pay Referrer
            transaction.update(referrerRef, { 
              walletBalance: currentReferrerBalance + REFERRAL_BONUS_REFERRER,
              referralCount: currentReferralCount + 1
            });

            // Set new user bonus
            startingBalance = REFERRAL_BONUS_NEW_USER;
          }
        }

        // Create New User Document
        transaction.set(newUserRef, {
          uid: newUserUid,
          name,
          email,
          profileId: `GS-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          walletBalance: startingBalance,
          referralCode: myReferralCode,
          referredBy: referrerUid || null,
          referralCount: 0,
          status: 'active',
          photoURL: "https://i.ibb.co/74CkxSP/avatar.png",
          createdAt: serverTimestamp()
        });
      });

      navigate('/');
    } catch (e: any) {
      console.error(e);
      let msg = "রেজিস্ট্রেশন করতে সমস্যা হচ্ছে।";
      if (e.code === 'auth/email-already-in-use') msg = "এই ইমেইলটি ইতিপূর্বে ব্যবহার করা হয়েছে।";
      else if (e.code === 'auth/invalid-email') msg = "ইমেইলটি সঠিক নয়।";
      setError(msg);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#F5F5F7] dark:bg-black transition-colors duration-300">
      <div className="w-full space-y-8 animate-fadeIn max-w-md">
        <div className="text-center">
          <h1 className="text-4xl font-black text-[#7B61FF] tracking-tighter">Vercel Top Up</h1>
          <p className="text-xs font-bold opacity-40 uppercase tracking-[0.3em] mt-2">Create Account</p>
        </div>

        <div className="bg-white dark:bg-[#1C1C1E] p-8 rounded-[2.5rem] shadow-xl border border-black/5 dark:border-white/5 space-y-6">
          <h2 className="text-2xl font-extrabold text-center tracking-tight">নতুন অ্যাকাউন্ট</h2>
          
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-xl text-red-600 dark:text-red-400 text-[11px] font-bold animate-shake text-center">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase opacity-40 ml-2">সম্পূর্ণ নাম</label>
              <input 
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="আপনার নাম" 
                className="w-full bg-[#F5F5F7] dark:bg-black p-4 rounded-2xl outline-none focus:ring-2 focus:ring-[#7B61FF] transition-all font-bold" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase opacity-40 ml-2">ইমেইল এড্রেস</label>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="example@mail.com" 
                className="w-full bg-[#F5F5F7] dark:bg-black p-4 rounded-2xl outline-none focus:ring-2 focus:ring-[#7B61FF] transition-all font-bold" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase opacity-40 ml-2">পাসওয়ার্ড</label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="কমপক্ষে ৬ অক্ষর" 
                className="w-full bg-[#F5F5F7] dark:bg-black p-4 rounded-2xl outline-none focus:ring-2 focus:ring-[#7B61FF] transition-all font-bold" 
              />
            </div>
            
            <div className="relative pt-2">
              <div className="absolute inset-x-0 top-0 flex items-center justify-center">
                <span className="bg-white dark:bg-[#1C1C1E] px-3 text-[9px] font-black uppercase opacity-30">Optional Bonus</span>
              </div>
              <div className="mt-4 space-y-1">
                <label className="text-[10px] font-black uppercase text-[#7B61FF] ml-2">রেফারেল কোড</label>
                <input 
                  type="text" 
                  value={referralInput}
                  onChange={e => setReferralInput(e.target.value)}
                  placeholder="রেফারেল কোড (থাকলে দিন)" 
                  className="w-full bg-[#7B61FF08] dark:bg-[#7B61FF15] p-4 rounded-2xl outline-none border-2 border-transparent focus:border-[#7B61FF] transition-all font-black text-[#7B61FF] uppercase placeholder:normal-case placeholder:font-bold" 
                />
              </div>
            </div>
          </div>

          <button 
            disabled={loading}
            onClick={handleSignup}
            className="w-full bg-[#7B61FF] text-white p-5 rounded-2xl font-black shadow-lg shadow-[#7B61FF4D] active:scale-95 transition-transform disabled:opacity-50"
          >
            {loading ? 'অপেক্ষা করুন...' : 'একাউন্ট তৈরি করুন'}
          </button>

          <p className="text-center text-sm font-medium text-gray-500">
            ইতোমধ্যে অ্যাকাউন্ট আছে? <Link to="/login" className="text-[#7B61FF] font-black">লগইন করুন</Link>
          </p>
        </div>
        
        <div className="text-center">
          <Link to="/" className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors">ফিরে যান</Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
