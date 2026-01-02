
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db, auth } from '../services/firebase';
import { collection, addDoc, serverTimestamp, doc, runTransaction } from 'firebase/firestore';

const PaymentGateway: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { provider } = location.state as { provider: 'bkash' | 'nagad' };
  const [trxId, setTrxId] = useState('');
  const [loading, setLoading] = useState(false);
  const pendingOrder = JSON.parse(localStorage.getItem('pendingOrder') || '{}');

  const isBkash = provider === 'bkash';

  const handleVerify = async () => {
    if (!trxId.trim()) return alert('ট্রানজেকশন আইডি দিন।');

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw "Not logged in";

      if (pendingOrder.orderType === 'add_money') {
        await addDoc(collection(db, 'moneyRequests'), {
          userId: user.uid,
          amount: pendingOrder.totalPrice,
          paymentMethod: isBkash ? 'bKash' : 'Nagad',
          adminNumber: pendingOrder.paymentNumber,
          userPaymentNumber: 'Gateway',
          transactionId: trxId,
          status: 'Pending',
          date: serverTimestamp()
        });
        alert('অ্যাড মানি রিকোয়েস্ট সফল!');
        navigate('/wallet');
      } else {
        // Game Topup
        await runTransaction(db, async (transaction) => {
          const gameRef = doc(db, 'games', pendingOrder.gameId);
          const gameSnap = await transaction.get(gameRef);
          if (!gameSnap.exists()) throw "গেম পাওয়া যায়নি।";

          const currentPackages = gameSnap.data().packages || [];
          const idx = currentPackages.findIndex((p: any) => p.amount === pendingOrder.packageAmount);
          if (idx === -1 || currentPackages[idx].stock < pendingOrder.quantity) throw "স্টক শেষ।";

          currentPackages[idx].stock -= pendingOrder.quantity;
          transaction.update(gameRef, { packages: currentPackages });

          const orderData = {
            userId: user.uid,
            game: pendingOrder.gameName,
            package: pendingOrder.packageAmount,
            quantity: pendingOrder.quantity,
            price: pendingOrder.totalPrice,
            playerId: pendingOrder.playerId,
            inputTypeLabel: 'প্লেয়ার আইডি',
            paymentMethod: isBkash ? 'bKash' : 'Nagad',
            transactionId: trxId,
            status: 'Pending',
            date: serverTimestamp()
          };

          const newOrderRef = doc(collection(db, 'orders'));
          transaction.set(newOrderRef, orderData);
          localStorage.setItem('lastOrder', JSON.stringify({ ...orderData, id: newOrderRef.id }));
        });
        navigate('/order-confirmation');
      }
      localStorage.removeItem('pendingOrder');
    } catch (e: any) {
      alert(e);
    }
    setLoading(false);
  };

  return (
    <div className={`min-h-screen ${isBkash ? 'bg-[#D12053]' : 'bg-[#CF1D23]'} text-white p-5 flex flex-col items-center`}>
      <header className="w-full flex justify-between items-center mb-10 bg-white/10 p-4 rounded-xl backdrop-blur-md">
        <i className="fa-solid fa-arrow-left cursor-pointer" onClick={() => navigate(-1)}></i>
        <span className="font-bold">Payment Gateway</span>
        <i className="fa-solid fa-xmark cursor-pointer" onClick={() => navigate('/')}></i>
      </header>

      <img 
        src={isBkash ? "https://i.ibb.co.com/1GDqN06T/5db8198b939c391189fd7be0038c16b6.png" : "https://i.ibb.co.com/4Z8HgrQV/Nagad-Logo-horizontally-Pngsource-VGQEUYU1.png"} 
        alt="Logo" 
        className="h-16 mb-8 drop-shadow-xl" 
      />

      <div className="w-full bg-white text-black p-5 rounded-xl mb-4 text-center font-bold text-lg shadow-lg">
        ৳ {parseFloat(pendingOrder.totalPrice).toFixed(2)}
      </div>

      <div className="w-full bg-white/20 p-8 rounded-t-3xl backdrop-blur-lg space-y-6 flex-1">
        <h3 className="text-center font-bold text-lg">ট্রানজেকশন আইডি দিন</h3>
        
        <input 
          type="text" 
          value={trxId} 
          onChange={(e) => setTrxId(e.target.value)} 
          placeholder="ট্রানজেকশন আইডি দিন" 
          className="w-full p-4 rounded-xl text-black font-bold outline-none focus:ring-4 focus:ring-yellow-400 transition-all"
        />

        <div className="text-[10px] leading-relaxed space-y-3 opacity-90">
            <p>১. আপনার {isBkash ? 'bKash' : 'Nagad'} অ্যাপে যান।</p>
            <p>২. "Send Money" এ ক্লিক করুন।</p>
            <p>৩. প্রাপক নম্বর: <strong className="text-yellow-400 text-lg mx-1">{pendingOrder.paymentNumber}</strong> <i className="fa-regular fa-copy cursor-pointer" onClick={() => navigator.clipboard.writeText(pendingOrder.paymentNumber)}></i></p>
            <p>৪. টাকার পরিমাণ: <strong className="text-yellow-400">৳ {pendingOrder.totalPrice}</strong></p>
            <p>৫. পিন দিয়ে লেনদেন সম্পন্ন করুন।</p>
            <p>৬. প্রাপ্ত ট্রানজেকশন আইডি (TrxID) উপরের বক্সে লিখে VERIFY বাটনে ক্লিক করুন।</p>
        </div>

        <button 
          disabled={loading}
          onClick={handleVerify}
          className="w-full bg-red-700 py-5 rounded-xl font-bold text-lg shadow-xl active:scale-95 transition-transform disabled:opacity-50"
        >
          {loading ? 'যাচাই করা হচ্ছে...' : 'VERIFY'}
        </button>
      </div>
    </div>
  );
};

export default PaymentGateway;
