
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../services/firebase';
import { collection, query, where, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { MoneyRequest, UserData } from '../types';

const HistorySkeleton = () => (
  <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-3xl shadow-sm border border-black/5 dark:border-white/10 space-y-4 animate-skeleton">
    <div className="flex justify-between items-center">
      <div className="h-6 w-20 bg-gray-200 dark:bg-white/5 rounded-full"></div>
      <div className="h-5 w-16 bg-gray-200 dark:bg-white/5 rounded-full"></div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div className="h-3 w-24 bg-gray-200 dark:bg-white/5 rounded-full"></div>
      <div className="h-3 w-20 ml-auto bg-gray-200 dark:bg-white/5 rounded-full"></div>
      <div className="h-3 w-32 bg-gray-200 dark:bg-white/5 rounded-full"></div>
      <div className="h-3 w-16 ml-auto bg-gray-200 dark:bg-white/5 rounded-full"></div>
    </div>
  </div>
);

const Wallet: React.FC = () => {
  const navigate = useNavigate();
  const [balance, setBalance] = useState<number | null>(null);
  const [history, setHistory] = useState<MoneyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const unsubUser = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (snap.exists()) setBalance(snap.data().walletBalance || 0);
      else setBalance(0);
    }, (err) => console.error("Balance fetch error:", err));

    const q = query(collection(db, 'moneyRequests'), where('userId', '==', user.uid));
    const unsubHistory = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as MoneyRequest));
      setHistory(list.sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0)));
      setLoading(false);
      setError(null);
    }, (err) => {
      console.error("History fetch error:", err);
      setError("হিস্টোরি লোড করতে সমস্যা হচ্ছে।");
      setLoading(false);
    });

    return () => {
      unsubUser();
      unsubHistory();
    };
  }, []);

  const deleteRequest = async (id: string) => {
    if (!confirm('আপনি কি রিকোয়েস্টটি মুছে ফেলতে চান?')) return;
    try {
      await deleteDoc(doc(db, 'moneyRequests', id));
    } catch (e) {
      alert("বাতিল করতে সমস্যা হয়েছে।");
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-extrabold text-center">আমার ওয়ালেট</h2>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-xl text-red-600 dark:text-red-400 text-sm font-bold text-center">
          {error}
        </div>
      )}

      {/* Balance Card */}
      <div className={`relative bg-gradient-to-br from-[#7B61FF] to-[#9f8eff] p-8 rounded-[2rem] text-white text-center shadow-xl shadow-[#7B61FF4D] overflow-hidden ${balance === null ? 'animate-skeleton' : ''}`}>
        <div className="absolute top-[-50px] right-[-50px] w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="relative z-10 space-y-4">
          <p className="text-sm font-medium opacity-80">বর্তমান ব্যালেন্স</p>
          {balance === null ? (
            <div className="h-14 w-40 bg-white/20 rounded-full mx-auto"></div>
          ) : (
            <h1 className="text-5xl font-extrabold tracking-tighter">৳ {balance.toFixed(2)}</h1>
          )}
          <button 
            disabled={balance === null}
            onClick={() => navigate('/add-money')}
            className="mt-4 px-8 py-3 bg-white text-[#7B61FF] rounded-full text-sm font-extrabold shadow-sm active:scale-95 transition-transform disabled:opacity-50"
          >
            অ্যাড মানি
          </button>
        </div>
      </div>

      <div className="space-y-5">
        <h3 className="text-lg font-bold">মানি রিকোয়েস্ট হিস্টোরি</h3>
        
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <HistorySkeleton key={i} />)}
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-20 opacity-30 space-y-4">
            <i className="fa-solid fa-file-invoice-dollar text-6xl"></i>
            <p>কোনো রিকোয়েস্ট নেই</p>
          </div>
        ) : (
          history.map(req => (
            <div key={req.id} className="bg-white dark:bg-[#1C1C1E] p-6 rounded-3xl shadow-sm border border-black/5 dark:border-white/10 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-lg font-extrabold">৳ {req.amount.toFixed(2)}</span>
                <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase ${req.status === 'Approved' ? 'bg-[#34C759]' : req.status === 'Pending' ? 'bg-[#FF9500]' : 'bg-[#FF3B30]'} text-white`}>
                  {req.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-y-2 text-[10px] font-medium opacity-60 uppercase tracking-widest">
                <span>মেথড: {req.paymentMethod}</span>
                <span className="text-right">নম্বর: {req.userPaymentNumber}</span>
                <span>TrxID: {req.transactionId}</span>
                <span className="text-right">{req.date?.toDate().toLocaleDateString('bn-BD')}</span>
              </div>
              
              {req.status === 'Pending' && (
                <button 
                  onClick={() => deleteRequest(req.id)}
                  className="w-full mt-2 py-2 bg-[#FF3B301A] text-[#FF3B30] text-[10px] font-bold rounded-lg border border-[#FF3B3033]"
                >
                  বাতিল করুন
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Wallet;
