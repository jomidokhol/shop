
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../services/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email) {
      setError('অনুগ্রহ করে আপনার ইমেইল এড্রেসটি দিন।');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess('আপনার ইমেইলে একটি পাসওয়ার্ড রিসেট লিঙ্ক পাঠানো হয়েছে। অনুগ্রহ করে আপনার ইনবক্স (বা স্প্যাম) চেক করুন।');
      setEmail('');
    } catch (e: any) {
      console.error(e);
      let msg = "পাসওয়ার্ড রিসেট লিঙ্ক পাঠাতে সমস্যা হয়েছে।";
      if (e.code === 'auth/user-not-found') msg = "এই ইমেইলে কোনো অ্যাকাউন্ট পাওয়া যায়নি।";
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
        </div>

        <div className="bg-white dark:bg-[#1C1C1E] p-8 rounded-[2rem] shadow-xl border border-black/5 dark:border-white/5 space-y-6">
          <h2 className="text-2xl font-extrabold text-center tracking-tight">পাসওয়ার্ড রিসেট</h2>
          
          <p className="text-sm text-center text-gray-500 font-medium">
            আপনার অ্যাকাউন্টের ইমেইল দিন, আমরা আপনাকে একটি পাসওয়ার্ড রিসেট লিঙ্ক পাঠাবো।
          </p>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-xl text-red-600 dark:text-red-400 text-sm font-bold animate-shake text-center">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-xl text-green-600 dark:text-green-400 text-sm font-bold text-center">
              {success}
            </div>
          )}

          <form onSubmit={handleReset} className="space-y-4">
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="আপনার ইমেইল" 
              className="w-full bg-[#F5F5F7] dark:bg-black p-5 rounded-2xl outline-none focus:ring-2 focus:ring-[#7B61FF] transition-all" 
            />

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-[#7B61FF] text-white p-5 rounded-2xl font-bold shadow-lg shadow-[#7B61FF4D] active:scale-95 transition-transform disabled:opacity-50"
            >
              {loading ? 'পাঠানো হচ্ছে...' : 'লিঙ্ক পাঠান'}
            </button>
          </form>

          <p className="text-center text-sm font-medium text-gray-500">
            পাসওয়ার্ড মনে পড়েছে? <Link to="/login" className="text-[#7B61FF] font-bold">লগইন করুন</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
