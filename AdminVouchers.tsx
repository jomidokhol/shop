
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/firebase';
import { collection, onSnapshot, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Voucher } from '../types';

const AdminVouchers: React.FC = () => {
  const navigate = useNavigate();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [minOrderAmount, setMinOrderAmount] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'vouchers'), (snap) => {
      setVouchers(snap.docs.map(d => ({ id: d.id, ...d.data() } as Voucher)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !discountValue) return alert('সব তথ্য পূরণ করুন।');

    const data = { 
      code: code.trim().toUpperCase(), 
      discountType, 
      discountValue: parseFloat(discountValue),
      minOrderAmount: parseFloat(minOrderAmount) || 0,
      isActive 
    };

    try {
      await addDoc(collection(db, 'vouchers'), data);
      alert('ভাউচার সফলভাবে যোগ করা হয়েছে।');
      resetForm();
    } catch (err) {
      console.error(err);
      alert('সমস্যা হয়েছে।');
    }
  };

  const resetForm = () => {
    setCode('');
    setDiscountValue('');
    setMinOrderAmount('');
    setIsActive(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('আপনি কি নিশ্চিত যে এই ভাউচারটি ডিলিট করতে চান?')) return;
    try {
      await deleteDoc(doc(db, 'vouchers', id));
    } catch (err) {
      alert('ডিলিট করতে সমস্যা হয়েছে।');
    }
  };

  const toggleStatus = async (voucher: Voucher) => {
    try {
      await updateDoc(doc(db, 'vouchers', voucher.id), { isActive: !voucher.isActive });
    } catch (err) {
      alert('আপডেট করতে সমস্যা হয়েছে।');
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-10 text-white">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/profile')} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shadow-sm">
          <i className="fa-solid fa-arrow-left text-white"></i>
        </button>
        <h2 className="text-xl font-extrabold text-white">কুপন/ভাউচার ম্যানেজমেন্ট</h2>
      </div>

      {/* Form */}
      <div className="bg-white/5 backdrop-blur-md p-8 rounded-[2rem] shadow-sm border border-white/10 space-y-6">
        <h3 className="text-lg font-bold text-white">নতুন ভাউচার যোগ করুন</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold opacity-60 uppercase ml-1 text-white">কুপন কোড (e.g., PROMO20)</label>
              <input 
                type="text" 
                value={code} 
                onChange={e => setCode(e.target.value)} 
                className="w-full bg-black/40 p-4 rounded-xl outline-none border border-white/10 focus:border-[#7B61FF] transition-all text-white font-black uppercase" 
                placeholder="PROMO20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold opacity-60 uppercase ml-1 text-white">ভ্যালু (Value)</label>
              <input 
                type="number" 
                value={discountValue} 
                onChange={e => setDiscountValue(e.target.value)} 
                className="w-full bg-black/40 p-4 rounded-xl outline-none border border-white/10 focus:border-[#7B61FF] transition-all text-white" 
                placeholder="20"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold opacity-60 uppercase ml-1 text-white">ভাউচার ধরণ</label>
              <select 
                value={discountType}
                onChange={e => setDiscountType(e.target.value as any)}
                className="w-full bg-black/40 p-4 rounded-xl outline-none border border-white/10 focus:border-[#7B61FF] transition-all text-white"
              >
                <option value="percentage">শতকরা (Percentage %)</option>
                <option value="fixed">স্থায়ী টাকা (Fixed Amount ৳)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold opacity-60 uppercase ml-1 text-white">ন্যূনতম অর্ডার অ্যামাউন্ট (Minimum)</label>
              <input 
                type="number" 
                value={minOrderAmount} 
                onChange={e => setMinOrderAmount(e.target.value)} 
                className="w-full bg-black/40 p-4 rounded-xl outline-none border border-white/10 focus:border-[#7B61FF] transition-all text-white" 
                placeholder="100"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 py-2">
            <span className="text-xs font-bold opacity-60 uppercase text-white">Status:</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={isActive} 
                onChange={(e) => setIsActive(e.target.checked)} 
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#7B61FF]"></div>
              <span className="ml-3 text-xs font-bold text-white">{isActive ? 'Active' : 'Inactive'}</span>
            </label>
          </div>

          <button 
            type="submit" 
            className="w-full bg-[#7B61FF] text-white py-4 rounded-xl font-bold shadow-lg shadow-[#7B61FF4D] active:scale-95 transition-transform"
          >
            যোগ করুন
          </button>
        </form>
      </div>

      {/* List */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white">বিদ্যমান ভাউচারসমূহ</h3>
        {loading ? (
          <div className="text-center animate-pulse text-white">লোড হচ্ছে...</div>
        ) : vouchers.length === 0 ? (
          <div className="text-center py-10 opacity-40 text-white">কোনো ভাউচার পাওয়া যায়নি।</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vouchers.map(v => (
              <div key={v.id} className="bg-white/5 backdrop-blur-sm p-6 rounded-3xl border border-white/10 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#7B61FF1A] rounded-xl flex items-center justify-center">
                    <i className="fa-solid fa-tag text-[#7B61FF]"></i>
                  </div>
                  <div>
                    <h4 className="font-bold text-white">{v.code}</h4>
                    <p className="text-[10px] font-black uppercase opacity-40 text-white">
                      {v.discountValue}{v.discountType === 'percentage' ? '%' : '৳'} Discount • Min: ৳{v.minOrderAmount}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => toggleStatus(v)} className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${v.isActive ? 'bg-[#34C7591A] text-[#34C759] border-[#34C75933]' : 'bg-white/10 text-white/40'} border`}>
                    <i className={`fa-solid ${v.isActive ? 'fa-toggle-on' : 'fa-toggle-off'}`}></i>
                  </button>
                  <button onClick={() => handleDelete(v.id)} className="w-9 h-9 bg-[#FF3B301A] text-[#FF3B30] rounded-lg flex items-center justify-center active:scale-90 transition-transform border border-[#FF3B3033]">
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminVouchers;
