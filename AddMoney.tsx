
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../services/firebase';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { PaymentMethod } from '../types';

const AddMoney: React.FC = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [userNumber, setUserNumber] = useState('');
  const [trxId, setTrxId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMethods = async () => {
      try {
        const snap = await getDocs(collection(db, 'paymentMethods'));
        setPaymentMethods(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaymentMethod)));
      } catch (err) {
        console.error("Payment methods fetch error:", err);
        setError("পেমেন্ট মেথড লোড করতে সমস্যা হচ্ছে।");
      }
    };
    fetchMethods();
  }, []);

  const handleRequest = async () => {
    setError(null);
    if (!amount || !selectedMethod) {
      setError('টাকার পরিমাণ ও পেমেন্ট মেথড সিলেক্ট করুন।');
      return;
    }

    const isGatewayMethod = selectedMethod.name.toLowerCase().includes('bkash') || selectedMethod.name.toLowerCase().includes('nagad');
    
    if (!isGatewayMethod && (!userNumber || !trxId)) {
        setError('আপনার পেমেন্ট নম্বর ও ট্রানজেকশন আইডি দিন।');
        return;
    }

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt < 10) return setError('কমপক্ষে ১০ টাকা অ্যাড করতে হবে।');

    if (isGatewayMethod) {
      const pendingOrder = {
        totalPrice: amt,
        paymentMethodName: selectedMethod.name,
        paymentNumber: selectedMethod.number,
        orderType: 'add_money'
      };
      localStorage.setItem('pendingOrder', JSON.stringify(pendingOrder));
      const provider = selectedMethod.name.toLowerCase().includes('bkash') ? 'bkash' : 'nagad';
      navigate('/payment-gateway', { state: { provider } });
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'moneyRequests'), {
        userId: auth.currentUser?.uid,
        amount: amt,
        paymentMethod: selectedMethod.name,
        adminNumber: selectedMethod.number,
        userPaymentNumber: userNumber,
        transactionId: trxId,
        status: 'Pending',
        date: serverTimestamp()
      });
      alert('সফলভাবে রিকোয়েস্ট পাঠানো হয়েছে!');
      navigate('/wallet');
    } catch (e: any) {
      console.error(e);
      setError("রিকোয়েস্ট পাঠাতে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 text-white">
      <div className="flex items-center gap-4 mb-4">
        <button onClick={() => navigate('/wallet')} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shadow-sm">
          <i className="fa-solid fa-arrow-left text-white"></i>
        </button>
        <h2 className="text-xl font-extrabold text-white">অ্যাড মানি</h2>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/30 p-4 rounded-xl text-white text-sm font-bold animate-shake text-center">
          {error}
        </div>
      )}

      <div className="bg-white/5 p-6 rounded-3xl shadow-sm border border-white/10 space-y-4">
        <h3 className="text-sm font-bold flex items-center gap-3 text-white">
          <span className="w-6 h-6 bg-[#7B61FF] text-white flex items-center justify-center rounded-full text-[10px]">1</span>
          অ্যামাউন্ট লিখুন
        </h3>
        <input 
          type="number" 
          value={amount} 
          onChange={(e) => setAmount(e.target.value)} 
          placeholder="e.g., 500" 
          className="w-full bg-black/40 p-4 rounded-xl outline-none focus:ring-2 focus:ring-[#7B61FF] transition-all text-white"
        />
      </div>

      <div className="bg-white/5 p-6 rounded-3xl shadow-sm border border-white/10 space-y-6">
        <h3 className="text-sm font-bold flex items-center gap-3 text-white">
          <span className="w-6 h-6 bg-[#7B61FF] text-white flex items-center justify-center rounded-full text-[10px]">2</span>
          পেমেন্ট মেথড বেছে নিন
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          {paymentMethods.map(method => (
            <div 
              key={method.id} 
              onClick={() => setSelectedMethod(method)}
              className={`p-4 rounded-2xl flex flex-col items-center justify-center gap-2 border-2 transition-all cursor-pointer ${selectedMethod?.id === method.id ? 'border-[#7B61FF] bg-[#7B61FF1A]' : 'border-transparent bg-black/40'}`}
            >
              <img src={method.logoUrl || 'https://via.placeholder.com/100'} alt={method.name} className="h-10 object-contain" />
              <span className="text-[10px] font-bold text-white">{method.name}</span>
            </div>
          ))}
        </div>

        {selectedMethod && !selectedMethod.name.toLowerCase().includes('bkash') && !selectedMethod.name.toLowerCase().includes('nagad') && (
          <div className="space-y-5 pt-4 animate-fadeIn">
            <div className="text-center p-4 bg-[#7B61FF1A] rounded-xl border border-[#7B61FF33]">
              <p className="text-xs font-medium opacity-60 text-white">নিচের নম্বরে টাকা পাঠান:</p>
              <div className="flex items-center justify-center gap-3 mt-1">
                <span className="text-lg font-extrabold text-[#7B61FF]">{selectedMethod.number}</span>
                <i className="fa-regular fa-copy text-[#7B61FF] cursor-pointer" onClick={() => navigator.clipboard.writeText(selectedMethod.number)}></i>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase opacity-50 ml-1 text-white">আপনার পেমেন্ট নম্বর</label>
                <input 
                  type="tel" 
                  value={userNumber} 
                  onChange={(e) => setUserNumber(e.target.value)} 
                  placeholder="যে নম্বর থেকে টাকা পাঠিয়েছেন" 
                  className="w-full bg-black/40 p-4 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#7B61FF] text-white" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase opacity-50 ml-1 text-white">ট্রানজেকশন আইডি</label>
                <input 
                  type="text" 
                  value={trxId} 
                  onChange={(e) => setTrxId(e.target.value)} 
                  placeholder="টাকা পাঠানোর পর প্রাপ্ত আইডি" 
                  className="w-full bg-black/40 p-4 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#7B61FF] text-white" 
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <button 
        disabled={loading}
        onClick={handleRequest}
        className="w-full bg-[#7B61FF] text-white p-5 rounded-2xl font-bold shadow-lg shadow-[#7B61FF4D] active:scale-95 transition-transform disabled:opacity-50"
      >
        {loading ? 'রিকোয়েস্ট পাঠানো হচ্ছে...' : 'রিকোয়েস্ট করুন'}
      </button>
    </div>
  );
};

export default AddMoney;
