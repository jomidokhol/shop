
import React, { useState, useEffect } from 'react';
import { db, auth } from '../services/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, runTransaction } from 'firebase/firestore';
import { Order } from '../types';

const OrderSkeleton = () => (
  <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/10 space-y-6 animate-skeleton">
    <div className="flex justify-between items-center border-b border-white/5 pb-3">
      <div className="h-5 w-32 bg-white/10 rounded-full"></div>
      <div className="h-5 w-16 bg-white/10 rounded-full"></div>
    </div>
    <div className="flex justify-between items-center px-4">
      <div className="w-10 h-10 rounded-full bg-white/10"></div>
      <div className="h-1 flex-1 bg-white/10 mx-2"></div>
      <div className="w-10 h-10 rounded-full bg-white/10"></div>
      <div className="h-1 flex-1 bg-white/10 mx-2"></div>
      <div className="w-10 h-10 rounded-full bg-white/10"></div>
    </div>
    <div className="space-y-3 pt-4">
      <div className="h-4 w-full bg-white/10 rounded-xl"></div>
      <div className="h-4 w-2/3 bg-white/10 rounded-xl"></div>
    </div>
  </div>
);

const OrderTimeline: React.FC<{ status: Order['status'] }> = ({ status }) => {
  const isPending = status === 'Pending';
  const isCompleted = status === 'Completed';
  const isFailed = status === 'Rejected' || status === 'Canceled';

  // Calculate progress percentage
  const getProgressWidth = () => {
    if (isFailed || isCompleted) return '100%';
    if (isPending) return '50%';
    return '0%';
  };

  const getProgressColor = () => {
    if (isFailed) return 'bg-[#FF3B30]';
    if (isCompleted) return 'bg-[#34C759]';
    return 'bg-[#7B61FF]';
  };

  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between relative px-4">
        {/* Progress Track Background */}
        <div className="absolute top-5 left-8 right-8 h-1.5 bg-white/5 z-0 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ease-in-out shadow-[0_0_15px_rgba(123,97,255,0.3)] ${getProgressColor()} ${isPending ? 'animate-pulse' : ''}`}
            style={{ width: getProgressWidth() }}
          />
        </div>

        {/* Step 1: Received */}
        <div className="relative z-10 flex flex-col items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 shadow-xl ${isFailed ? 'bg-[#FF3B30] border-[#FF3B30]' : 'bg-[#7B61FF] border-[#7B61FF]'} text-white`}>
            <i className="fa-solid fa-receipt text-sm"></i>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-white/40">রিসিভড</span>
        </div>

        {/* Step 2: Processing */}
        <div className="relative z-10 flex flex-col items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 shadow-xl ${isFailed ? 'bg-[#FF3B30] border-[#FF3B30]' : isCompleted ? 'bg-[#34C759] border-[#34C759]' : 'bg-[#7B61FF] border-[#7B61FF] animate-pulse shadow-[0_0_20px_rgba(123,97,255,0.5)]'} text-white`}>
            <i className="fa-solid fa-gears text-sm"></i>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-white/40">প্রসেসিং</span>
        </div>

        {/* Step 3: Result */}
        <div className="relative z-10 flex flex-col items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border-2 transition-all duration-700 shadow-xl ${isCompleted ? 'bg-[#34C759] border-[#34C759] scale-110 shadow-[0_0_20px_rgba(52,199,89,0.5)]' : isFailed ? 'bg-[#FF3B30] border-[#FF3B30] scale-110 shadow-[0_0_20px_rgba(255,59,48,0.5)]' : 'bg-black/40 border-white/10'} text-white`}>
            {isCompleted ? (
              <i className="fa-solid fa-check text-sm"></i>
            ) : isFailed ? (
              <i className="fa-solid fa-xmark text-sm"></i>
            ) : (
              <i className="fa-solid fa-box-open text-sm opacity-20"></i>
            )}
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
            {isFailed ? (status === 'Rejected' ? 'রিজেক্টেড' : 'বাতিল') : 'ডেলিভারি'}
          </span>
        </div>
      </div>
    </div>
  );
};

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(collection(db, 'orders'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setOrders(list.sort((a, b) => {
        const dateA = a.date?.seconds || 0;
        const dateB = b.date?.seconds || 0;
        return dateB - dateA;
      }));
      setLoading(false);
      setError(null);
    }, (err) => {
      console.error("Orders fetch error:", err);
      setError("অর্ডার লোড করতে সমস্যা হচ্ছে।");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredOrders = orders.filter(order => 
    order.game.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.playerId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCancel = async (order: Order) => {
    if (!confirm('আপনি কি নিশ্চিতভাবে এই অর্ডারটি বাতিল করতে চান? যদি ওয়ালেট দিয়ে পেমেন্ট করে থাকেন, তবে টাকা ফেরত দেওয়া হবে।')) return;

    setActionLoading(order.id);
    try {
      await runTransaction(db, async (transaction) => {
        const orderRef = doc(db, 'orders', order.id);
        const orderSnap = await transaction.get(orderRef);
        
        if (!orderSnap.exists()) throw "অর্ডার পাওয়া যায়নি।";
        if (orderSnap.data().status !== 'Pending') throw "অর্ডারটি ইতিমধ্যে প্রসেস হয়েছে।";

        if (order.transactionId === 'WALLET_PAY' || order.paymentMethod === 'Wallet') {
          const userRef = doc(db, 'users', order.userId);
          const userSnap = await transaction.get(userRef);
          if (userSnap.exists()) {
            const currentBalance = userSnap.data().walletBalance || 0;
            transaction.update(userRef, { walletBalance: currentBalance + order.price });
          }
        }
        transaction.update(orderRef, { status: 'Canceled' });
      });
      alert('অর্ডার সফলভাবে বাতিল করা হয়েছে।');
    } catch (e: any) {
      console.error(e);
      alert(e.toString() || "অর্ডার বাতিল করতে সমস্যা হয়েছে।");
    } finally {
      setActionLoading(null);
    }
  };

  const handleEdit = async (order: Order) => {
    const newPlayerId = prompt('আপনার নতুন প্লেয়ার আইডি/ইমেইল দিন:', order.playerId);
    if (newPlayerId && newPlayerId.trim() && newPlayerId.trim() !== order.playerId) {
      setActionLoading(order.id);
      try {
        await updateDoc(doc(db, 'orders', order.id), { playerId: newPlayerId.trim() });
        alert('সফলভাবে আপডেট করা হয়েছে।');
      } catch (e) {
        alert("আপডেট করতে সমস্যা হয়েছে।");
      } finally {
        setActionLoading(null);
      }
    }
  };

  return (
    <div className="space-y-10 max-w-5xl mx-auto pb-20 text-white">
      <div className="text-center space-y-3">
        <div className="inline-block px-4 py-1.5 bg-[#7B61FF1A] rounded-full border border-[#7B61FF33] mb-2">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#7B61FF]">Live Tracking</span>
        </div>
        <h2 className="text-4xl font-black tracking-tight text-white">অর্ডার হিস্টোরি</h2>
        <p className="text-sm opacity-60 text-white">রিয়েল-টাইমে আপনার অর্ডারের অগ্রগতি দেখুন</p>
      </div>

      {/* Search Bar */}
      <div className="max-w-2xl mx-auto w-full px-2">
        <div className="relative group">
          <i className="fa-solid fa-magnifying-glass absolute left-6 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-[#7B61FF] transition-colors"></i>
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="অর্ডার আইডি বা গেম দিয়ে খুঁজুন..."
            className="w-full bg-white/5 py-5 pl-16 pr-8 rounded-[2.5rem] border border-white/10 shadow-2xl outline-none focus:ring-2 focus:ring-[#7B61FF] transition-all font-bold text-white placeholder:text-white/20"
          />
        </div>
      </div>

      {error && (
        <div className="max-w-md mx-auto bg-red-500/10 border border-red-500/20 p-5 rounded-2xl text-red-500 text-sm font-bold text-center animate-shake">
          <i className="fa-solid fa-triangle-exclamation mr-2"></i> {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[1, 2, 3, 4].map(i => <OrderSkeleton key={i} />)}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-32 space-y-6 opacity-30 flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
            <i className="fa-solid fa-box-open text-5xl"></i>
          </div>
          <p className="font-black uppercase tracking-[0.3em] text-xs">কোনো অর্ডার পাওয়া যায়নি</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filteredOrders.map(order => (
            <div key={order.id} className="group bg-white/5 backdrop-blur-xl p-8 rounded-[3rem] border border-white/10 space-y-8 relative hover:border-[#7B61FF44] hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all duration-500 hover:-translate-y-2">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h4 className="font-black text-2xl tracking-tight text-white">{order.game}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono opacity-40 uppercase tracking-tighter text-white">#ORD-{order.id.slice(0, 8)}</span>
                    <button 
                      onClick={() => { navigator.clipboard.writeText(order.id); alert('অর্ডার আইডি কপি করা হয়েছে'); }}
                      className="w-5 h-5 flex items-center justify-center rounded-md bg-white/5 hover:bg-[#7B61FF] transition-colors"
                    >
                      <i className="fa-regular fa-copy text-[8px] text-white"></i>
                    </button>
                  </div>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg ${order.status === 'Completed' ? 'bg-[#34C759] text-white' : order.status === 'Rejected' || order.status === 'Canceled' ? 'bg-[#FF3B30] text-white' : 'bg-[#7B61FF] text-white'}`}>
                   {order.status}
                </div>
              </div>

              {/* Enhanced Visual Timeline */}
              <OrderTimeline status={order.status} />

              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-1 gap-3">
                  <DetailItem label="প্যাকেজ" value={`${order.package} ${order.quantity > 1 ? `(Qty: ${order.quantity})` : ''}`} />
                  <DetailItem label={order.inputTypeLabel || 'প্লেয়ার আইডি'} value={order.playerId} isHighlight />
                  <DetailItem label="পেমেন্ট" value={order.paymentMethod} />
                  {order.transactionId && <DetailItem label="ট্রানজেকশন আইডি" value={order.transactionId} isMono />}
                  
                  {order.voucherCode && (
                    <div className="flex justify-between items-center bg-[#34C7590A] p-4 rounded-2xl border border-[#34C75922]">
                      <span className="text-[10px] font-black text-[#34C759] uppercase tracking-widest">কুপন ({order.voucherCode})</span>
                      <span className="text-xs font-black text-[#34C759]">- ৳ {order.discountAmount?.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center bg-[#7B61FF1A] p-4 rounded-2xl border border-[#7B61FF33]">
                    <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">মোট পরিশোধ</span>
                    <span className="font-black text-xl text-[#7B61FF]">৳ {order.price.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[10px] font-bold opacity-30 uppercase tracking-widest px-1">
                  <span>{order.date?.toDate().toLocaleDateString('bn-BD')}</span>
                  <span>{order.date?.toDate().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              {order.adminNote && (
                <div className="bg-[#34C7591A] border border-[#34C75933] p-5 rounded-[2rem] flex gap-4 animate-fadeIn">
                  <div className="w-10 h-10 rounded-xl bg-[#34C75933] flex items-center justify-center shrink-0">
                    <i className="fa-solid fa-comment-dots text-[#34C759]"></i>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-[#34C759] uppercase tracking-[0.2em]">এডমিন মেসেজ</span>
                    <p className="text-sm font-bold leading-relaxed text-white">{order.adminNote}</p>
                  </div>
                </div>
              )}

              {order.status === 'Pending' && (
                <div className="flex gap-4">
                  <button 
                    disabled={actionLoading === order.id}
                    onClick={() => handleEdit(order)}
                    className="flex-1 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 text-white"
                  >
                    {actionLoading === order.id ? 'অপেক্ষা করুন...' : 'এডিট আইডি'}
                  </button>
                  <button 
                    disabled={actionLoading === order.id}
                    onClick={() => handleCancel(order)}
                    className="flex-1 py-4 bg-[#FF3B30] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-500/20 hover:bg-[#e0352b] transition-all active:scale-95 disabled:opacity-50"
                  >
                    {actionLoading === order.id ? 'বাতিল হচ্ছে...' : 'অর্ডার বাতিল'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const DetailItem: React.FC<{ label: string, value: string, isMono?: boolean, isHighlight?: boolean }> = ({ label, value, isMono, isHighlight }) => (
  <div className="flex justify-between items-center bg-black/20 p-4 rounded-2xl border border-white/5">
    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{label}</span>
    <span className={`text-xs font-black text-white text-right break-all ml-4 ${isMono ? 'font-mono tracking-tighter text-[11px]' : ''} ${isHighlight ? 'text-[#7B61FF]' : ''}`}>
      {value}
    </span>
  </div>
);

export default Orders;
