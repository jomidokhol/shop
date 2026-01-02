
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/firebase';
import { collection, onSnapshot, doc, addDoc, updateDoc, deleteDoc, writeBatch, getDocs } from 'firebase/firestore';
import { PaymentMethod } from '../types';

const AdminPaymentMethods: React.FC = () => {
  const navigate = useNavigate();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFixing, setIsFixing] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [number, setNumber] = useState('');

  const PLACEHOLDER_LOGO = "https://i.ibb.co/74CkxSP/avatar.png";

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'paymentMethods'), (snap) => {
      setMethods(snap.docs.map(d => ({ id: d.id, ...d.data() } as PaymentMethod)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !number) return alert('সব তথ্য পূরণ করুন।');

    const data = { 
      name, 
      logoUrl: logoUrl.trim() || PLACEHOLDER_LOGO, 
      number 
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, 'paymentMethods', editingId), data);
        alert('সফলভাবে আপডেট হয়েছে।');
      } else {
        await addDoc(collection(db, 'paymentMethods'), data);
        alert('সফলভাবে যোগ করা হয়েছে।');
      }
      resetForm();
    } catch (err) {
      console.error(err);
      alert('সমস্যা হয়েছে।');
    }
  };

  const fixMissingLogos = async () => {
    if (!confirm('আপনি কি সব পেমেন্ট মেথডের লোগো চেক করে ফিক্স করতে চান?')) return;
    setIsFixing(true);
    try {
      const snap = await getDocs(collection(db, 'paymentMethods'));
      const batch = writeBatch(db);
      let count = 0;
      
      snap.docs.forEach((d) => {
        const data = d.data();
        if (!data.logoUrl) {
          batch.update(d.ref, { logoUrl: PLACEHOLDER_LOGO });
          count++;
        }
      });

      if (count > 0) {
        await batch.commit();
        alert(`${count}টি মেথড আপডেট করা হয়েছে।`);
      } else {
        alert('সব মেথডেই লোগো আছে।');
      }
    } catch (err) {
      console.error(err);
      alert('ফিক্স করতে সমস্যা হয়েছে।');
    }
    setIsFixing(false);
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setLogoUrl('');
    setNumber('');
  };

  const handleEdit = (method: PaymentMethod) => {
    setEditingId(method.id);
    setName(method.name);
    setLogoUrl(method.logoUrl || '');
    setNumber(method.number);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('আপনি কি নিশ্চিত যে এটি ডিলিট করতে চান?')) return;
    try {
      await deleteDoc(doc(db, 'paymentMethods', id));
    } catch (err) {
      alert('ডিলিট করতে সমস্যা হয়েছে।');
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-10 text-white">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/profile')} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shadow-sm">
            <i className="fa-solid fa-arrow-left text-white"></i>
          </button>
          <h2 className="text-xl font-extrabold text-white">পেমেন্ট মেথড ম্যানেজমেন্ট</h2>
        </div>
        <button 
          onClick={fixMissingLogos}
          disabled={isFixing}
          className="bg-orange-500/20 text-orange-400 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border border-orange-500/30 hover:bg-orange-500/30 transition-all"
        >
          {isFixing ? 'ফিক্স হচ্ছে...' : 'ফিক্স লোগো'}
        </button>
      </div>

      {/* Form */}
      <div className="bg-white/5 backdrop-blur-md p-8 rounded-[2rem] shadow-sm border border-white/10 space-y-6">
        <h3 className="text-lg font-bold text-white">{editingId ? 'মেথড এডিট করুন' : 'নতুন মেথড যোগ করুন'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold opacity-60 uppercase ml-1 text-white">মেথড নাম (e.g., bKash Personal)</label>
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                className="w-full bg-black/40 p-4 rounded-xl outline-none border border-white/10 focus:border-[#7B61FF] transition-all text-white" 
                placeholder="বিকাশ পার্সোনাল"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold opacity-60 uppercase ml-1 text-white">নম্বর</label>
              <input 
                type="text" 
                value={number} 
                onChange={e => setNumber(e.target.value)} 
                className="w-full bg-black/40 p-4 rounded-xl outline-none border border-white/10 focus:border-[#7B61FF] transition-all text-white" 
                placeholder="017XXXXXXXX"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold opacity-60 uppercase ml-1 text-white">লোগো URL (খালি রাখলে ডিফল্ট লোগো বসবে)</label>
            <input 
              type="text" 
              value={logoUrl} 
              onChange={e => setLogoUrl(e.target.value)} 
              className="w-full bg-black/40 p-4 rounded-xl outline-none border border-white/10 focus:border-[#7B61FF] transition-all text-white" 
              placeholder="https://image-link.com/logo.png"
            />
          </div>
          <div className="flex gap-2">
            <button 
              type="submit" 
              className="flex-1 bg-[#7B61FF] text-white py-4 rounded-xl font-bold shadow-lg shadow-[#7B61FF4D] active:scale-95 transition-transform"
            >
              {editingId ? 'আপডেট করুন' : 'যোগ করুন'}
            </button>
            {editingId && (
              <button 
                type="button" 
                onClick={resetForm}
                className="px-6 bg-white/10 py-4 rounded-xl font-bold transition-all text-white"
              >
                বাতিল
              </button>
            )}
          </div>
        </form>
      </div>

      {/* List */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white">বিদ্যমান মেথডসমূহ</h3>
        {loading ? (
          <div className="text-center animate-pulse text-white">লোড হচ্ছে...</div>
        ) : methods.length === 0 ? (
          <div className="text-center py-10 opacity-40 text-white">কোনো মেথড পাওয়া যায়নি।</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {methods.map(method => (
              <div key={method.id} className="bg-white/5 backdrop-blur-sm p-6 rounded-3xl border border-white/10 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                  <img src={method.logoUrl || PLACEHOLDER_LOGO} alt={method.name} className="w-12 h-12 object-contain rounded-xl bg-black/40 p-2 border border-white/10" />
                  <div>
                    <h4 className="font-bold text-white">{method.name}</h4>
                    <p className="text-sm opacity-60 text-white">{method.number}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(method)} className="w-9 h-9 bg-[#7B61FF1A] text-[#7B61FF] rounded-lg flex items-center justify-center active:scale-90 transition-transform border border-[#7B61FF33]">
                    <i className="fa-solid fa-pen"></i>
                  </button>
                  <button onClick={() => handleDelete(method.id)} className="w-9 h-9 bg-[#FF3B301A] text-[#FF3B30] rounded-lg flex items-center justify-center active:scale-90 transition-transform border border-[#FF3B3033]">
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

export default AdminPaymentMethods;
