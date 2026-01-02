
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const OrderConfirmation: React.FC = () => {
  const navigate = useNavigate();
  const order = JSON.parse(localStorage.getItem('lastOrder') || '{}');

  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="space-y-10 flex flex-col items-center justify-center min-h-[80vh] pb-20 text-white">
      <div className="relative">
        <div className="w-28 h-28 bg-[#34C7591A] rounded-[2.5rem] flex items-center justify-center border-4 border-[#34C75933] shadow-[0_0_50px_rgba(52,199,89,0.2)] animate-fadeIn">
          <i className="fa-solid fa-check-double text-5xl text-[#34C759]"></i>
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#7B61FF] rounded-full border-4 border-black flex items-center justify-center animate-bounce">
          <i className="fa-solid fa-gift text-xs text-white"></i>
        </div>
      </div>
      
      <div className="text-center space-y-3">
        <h2 className="text-4xl font-black tracking-tight text-white">অর্ডার সফল হয়েছে!</h2>
        <p className="text-sm opacity-60 font-medium max-w-xs text-white">আপনার অর্ডারটি প্রসেস করার জন্য এডমিন প্যানেলে পাঠানো হয়েছে।</p>
      </div>

      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl p-10 rounded-[3.5rem] shadow-2xl border border-white/10 space-y-6 animate-fadeInUp">
        <div className="space-y-4">
           <ConfirmationRow label="গেম" value={order.game} />
           <ConfirmationRow label="প্যাকেজ" value={`${order.package} ${order.quantity > 1 ? `(x${order.quantity})` : ''}`} />
           <ConfirmationRow label="প্লেয়ার আইডি" value={order.playerId} />
           <div className="pt-4 border-t border-white/10 flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">মোট পরিশোধিত</span>
              <span className="text-2xl font-black text-[#7B61FF]">৳ {parseFloat(order.price || 0).toFixed(2)}</span>
           </div>
        </div>
      </div>

      <div className="w-full max-w-md grid grid-cols-1 gap-4 pt-6">
        <button 
          onClick={() => navigate('/orders')}
          className="w-full bg-[#7B61FF] text-white py-6 rounded-[2rem] font-black text-sm tracking-widest uppercase shadow-[0_20px_40px_rgba(123,97,255,0.3)] hover:shadow-[0_25px_50px_rgba(123,97,255,0.4)] hover:-translate-y-1 active:scale-95 transition-all"
        >
          অর্ডার ট্র্যাক করুন
        </button>
        <button 
          onClick={() => navigate('/')}
          className="w-full bg-white/5 text-white py-6 rounded-[2rem] font-black text-sm tracking-widest uppercase border border-white/10 hover:bg-white/10 transition-all"
        >
          আরো টপ-আপ করুন
        </button>
      </div>
    </div>
  );
};

const ConfirmationRow: React.FC<{ label: string, value: string }> = ({ label, value }) => (
  <div className="flex justify-between items-center py-1">
    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{label}</span>
    <span className="text-sm font-bold text-white">{value}</span>
  </div>
);

export default OrderConfirmation;
