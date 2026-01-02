
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { auth, db } from '../services/firebase';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { UserData, Order, AppNotification } from '../types';
import SupportChat from './SupportChat';

interface LayoutProps {
  children?: React.ReactNode;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, isDarkMode, setIsDarkMode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [branding, setBranding] = useState({ appName: 'Vercel Top Up', profileIconUrl: '' });
  const [isOnline, setIsOnline] = useState(false);
  
  // Notification States
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [toast, setToast] = useState<AppNotification | null>(null);
  const prevOrdersRef = useRef<Record<string, string>>({});
  const isFirstLoad = useRef(true);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        const userDoc = doc(db, 'users', user.uid);
        onSnapshot(userDoc, (snapshot) => {
          if (snapshot.exists()) {
            setUserData(snapshot.data() as UserData);
          }
        });

        const ordersQuery = query(collection(db, 'orders'), where('userId', '==', user.uid));
        const unsubOrders = onSnapshot(ordersQuery, (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            const orderData = change.doc.data() as Order;
            const orderId = change.doc.id;
            const newStatus = orderData.status;
            const oldStatus = prevOrdersRef.current[orderId];

            if (!isFirstLoad.current && oldStatus && oldStatus !== newStatus) {
              const notif: AppNotification = {
                id: Math.random().toString(36).substr(2, 9),
                title: newStatus === 'Completed' ? 'অর্ডার কমপ্লিট!' : 'অর্ডার রিজেক্টেড',
                message: `${orderData.game} - ${orderData.package} এর অর্ডারটি ${newStatus === 'Completed' ? 'সফলভাবে সম্পন্ন হয়েছে' : 'বাতিল করা হয়েছে'}।`,
                type: newStatus === 'Completed' ? 'success' : 'error',
                timestamp: Date.now(),
                read: false,
                orderId: orderId
              };
              
              setNotifications(prev => [notif, ...prev]);
              setToast(notif);
              setTimeout(() => setToast(null), 5000);
            }
            
            prevOrdersRef.current[orderId] = newStatus;
          });
          isFirstLoad.current = false;
        });

        return () => unsubOrders();
      } else {
        setUserData(null);
        setNotifications([]);
      }
    });

    const brandingDoc = doc(db, 'settings', 'branding');
    onSnapshot(brandingDoc, (snapshot) => {
      if (snapshot.exists()) {
        setBranding(snapshot.data() as any);
      }
    });

    const onlineDoc = doc(db, 'settings', 'onlineStatus');
    onSnapshot(onlineDoc, (snapshot) => {
      if (snapshot.exists()) {
        setIsOnline(snapshot.data()?.isOnline);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const isActive = (path: string) => location.pathname === path;
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setIsNotifOpen(false);
  };

  return (
    <div className={`flex flex-col min-h-screen transition-colors duration-300 text-white ${isDarkMode ? 'dark bg-[#000000]' : 'bg-[#1A1A1C]'}`}>
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-24 right-5 left-5 md:left-auto md:w-80 z-[2000] animate-fadeIn">
          <div className={`p-4 rounded-2xl shadow-2xl border flex items-center gap-4 ${toast.type === 'success' ? 'bg-[#34C759] text-white border-white/20' : 'bg-[#FF3B30] text-white border-white/20'}`}>
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <i className={`fa-solid ${toast.type === 'success' ? 'fa-check' : 'fa-xmark'} text-lg text-white`}></i>
            </div>
            <div className="flex-1">
              <p className="text-xs font-black uppercase tracking-wider text-white">{toast.title}</p>
              <p className="text-[10px] font-bold opacity-90 leading-tight text-white">{toast.message}</p>
            </div>
            <button onClick={() => setToast(null)} className="opacity-60 hover:opacity-100">
              <i className="fa-solid fa-xmark text-white"></i>
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 h-20 z-[999] backdrop-blur-xl border-b transition-all border-white/5 text-white ${isDarkMode ? 'bg-black/60' : 'bg-black/40'}`}>
        <div className="max-w-7xl mx-auto h-full px-5 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-3 overflow-hidden group">
              <img 
                src={branding.profileIconUrl || "https://i.ibb.co/74CkxSP/avatar.png"} 
                alt="Logo" 
                className="w-10 h-10 rounded-xl object-cover transition-transform group-hover:scale-110 shadow-sm" 
              />
              <h1 className="text-lg md:text-xl font-extrabold tracking-tight whitespace-nowrap overflow-hidden text-ellipsis text-white">
                {branding.appName}
              </h1>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              <DesktopNavItem to="/" label="হোম" active={isActive('/')} />
              <DesktopNavItem to="/wallet" label="ওয়ালেট" active={isActive('/wallet')} />
              <DesktopNavItem to="/orders" label="অর্ডার" active={isActive('/orders')} />
              {userData?.role === 'admin' && <DesktopNavItem to="/admin/payment-methods" label="এডমিন" active={isActive('/admin/payment-methods')} />}
            </nav>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 transition-all text-[#7B61FF]"
              title={isDarkMode ? 'লাইট মোড অন করুন' : 'ডার্ক মোড অন করুন'}
            >
              <i className={`fa-solid ${isDarkMode ? 'fa-sun' : 'fa-moon'} text-lg`}></i>
            </button>

            {userData && (
              <div className="flex items-center gap-2 md:gap-4">
                <div className="relative">
                  <button 
                    onClick={() => setIsNotifOpen(!isNotifOpen)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isNotifOpen ? 'bg-[#7B61FF] text-white' : 'bg-white/5 hover:bg-white/10'}`}
                  >
                    <i className="fa-solid fa-bell text-lg text-white"></i>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#FF3B30] text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-black animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {isNotifOpen && (
                    <div className={`absolute top-12 right-0 w-80 max-h-[400px] overflow-hidden rounded-[1.5rem] shadow-2xl border animate-fadeIn z-[1001] flex flex-col bg-[#1C1C1E] border-white/10`}>
                      <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20">
                        <span className="font-black text-sm uppercase tracking-widest text-white">নোটিফিকেশন</span>
                        <button onClick={markAllRead} className="text-[10px] font-bold text-[#7B61FF] hover:underline">সব মুছে দিন</button>
                      </div>
                      <div className="flex-1 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-10 text-center opacity-30 flex flex-col items-center gap-2">
                            <i className="fa-solid fa-bell-slash text-3xl text-white"></i>
                            <p className="text-xs font-bold text-white">কোনো নোটিফিকেশন নেই</p>
                          </div>
                        ) : (
                          notifications.map(n => (
                            <div 
                              key={n.id} 
                              onClick={() => { navigate('/orders'); setIsNotifOpen(false); }}
                              className={`p-4 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors ${!n.read ? 'bg-[#7B61FF08]' : ''}`}
                            >
                              <div className="flex gap-3">
                                <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${n.type === 'success' ? 'bg-[#34C7591A] text-[#34C759]' : 'bg-[#FF3B301A] text-[#FF3B30]'}`}>
                                  <i className={`fa-solid ${n.type === 'success' ? 'fa-check' : 'fa-triangle-exclamation'} text-xs`}></i>
                                </div>
                                <div className="space-y-0.5">
                                  <p className="text-xs font-bold text-white">{n.title}</p>
                                  <p className="text-[10px] opacity-60 leading-tight text-white">{n.message}</p>
                                  <p className="text-[8px] font-black opacity-30 uppercase text-white">{new Date(n.timestamp).toLocaleTimeString()}</p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <Link to="/add-money" className="flex items-center gap-2 bg-[#7B61FF1A] py-1.5 px-3 md:px-4 rounded-full transition-transform active:scale-95 hover:bg-[#7B61FF2A] border border-[#7B61FF1A]">
                  <i className="fa-solid fa-wallet text-[#7B61FF]"></i>
                  <span className="text-xs md:text-sm font-bold text-white">৳ {userData.walletBalance.toFixed(2)}</span>
                </Link>
              </div>
            )}
            
            <div className="relative">
              {userData ? (
                <Link to="/profile" className="flex items-center gap-2 group">
                  <div className="hidden md:block text-right">
                    <p className="text-xs font-bold opacity-80 leading-none text-white">{userData.name}</p>
                    <p className="text-[10px] opacity-40 leading-none mt-1 text-white">{userData.profileId}</p>
                  </div>
                  <img 
                    src={userData.photoURL || "https://i.ibb.co/74CkxSP/avatar.png"} 
                    alt="Avatar" 
                    className="w-9 h-9 rounded-full object-cover border-2 border-white/10 shadow-sm group-hover:border-[#7B61FF] transition-all" 
                  />
                </Link>
              ) : (
                <button 
                  onClick={() => navigate('/login')}
                  className="bg-[#7B61FF] text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-[#6b52e6] transition-colors shadow-lg shadow-[#7B61FF44]"
                >
                  লগইন
                </button>
              )}
              <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-black/40 ${isOnline ? 'bg-[#34C759]' : 'bg-[#FF3B30]'}`}></span>
            </div>
          </div>
        </div>
      </header>

      {/* Content Container */}
      <main className="max-w-7xl mx-auto px-5 pt-24 flex-1 w-full animate-fadeIn text-white">
        {children}
      </main>

      {/* Global Footer */}
      <footer className={`mt-20 border-t transition-colors border-white/5 text-white ${isDarkMode ? 'bg-[#0A0A0B]' : 'bg-[#0D0D0E]'}`}>
        <div className="max-w-7xl mx-auto px-5 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {/* Brand Column */}
            <div className="space-y-6">
              <Link to="/" className="flex items-center gap-3">
                <img src={branding.profileIconUrl || "https://i.ibb.co/74CkxSP/avatar.png"} alt="Logo" className="w-12 h-12 rounded-2xl object-cover shadow-lg" />
                <h2 className="text-xl font-black tracking-tight text-white">{branding.appName}</h2>
              </Link>
              <p className="text-sm opacity-50 font-medium leading-relaxed text-white">
                বাংলাদেশের সবচাইতে নির্ভরযোগ্য এবং দ্রুততম গেম টপ-আপ প্ল্যাটফর্ম। আমরা দিচ্ছি সবচাইতে কম দামে সেরা সার্ভিস।
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-[#7B61FF] hover:text-white transition-all text-white"><i className="fa-brands fa-facebook-f"></i></a>
                <a href="#" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-[#7B61FF] hover:text-white transition-all text-white"><i className="fa-brands fa-whatsapp"></i></a>
                <a href="#" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-[#7B61FF] hover:text-white transition-all text-white"><i className="fa-brands fa-youtube"></i></a>
              </div>
            </div>

            {/* Platform Links */}
            <div className="space-y-6">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#7B61FF]">প্ল্যাটফর্ম</h3>
              <ul className="space-y-4">
                <li><Link to="/" className="text-sm font-bold opacity-60 hover:opacity-100 hover:text-[#7B61FF] transition-all text-white">হোম পেজ</Link></li>
                <li><Link to="/" className="text-sm font-bold opacity-60 hover:opacity-100 hover:text-[#7B61FF] transition-all text-white">গেম লিস্ট</Link></li>
                <li><Link to="/orders" className="text-sm font-bold opacity-60 hover:opacity-100 hover:text-[#7B61FF] transition-all text-white">অর্ডার ট্র্যাকিং</Link></li>
              </ul>
            </div>

            {/* My Account */}
            <div className="space-y-6">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#7B61FF]">আমার অ্যাকাউন্ট</h3>
              <ul className="space-y-4">
                <li><Link to="/wallet" className="text-sm font-bold opacity-60 hover:opacity-100 hover:text-[#7B61FF] transition-all text-white">ওয়ালেট ব্যালেন্স</Link></li>
                <li><Link to="/add-money" className="text-sm font-bold opacity-60 hover:opacity-100 hover:text-[#7B61FF] transition-all text-white">টাকা অ্যাড করুন</Link></li>
                <li><Link to="/profile" className="text-sm font-bold opacity-60 hover:opacity-100 hover:text-[#7B61FF] transition-all text-white">প্রোফাইল সেটিংস</Link></li>
                {userData?.role === 'admin' && (
                   <li><Link to="/admin/payment-methods" className="text-sm font-bold text-[#FF3B30] hover:underline">এডমিন প্যানেল</Link></li>
                )}
              </ul>
            </div>

            {/* Support */}
            <div className="space-y-6">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#7B61FF]">সহযোগিতা</h3>
              <ul className="space-y-4">
                <li><button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="text-sm font-bold opacity-60 hover:opacity-100 hover:text-[#7B61FF] transition-all text-left text-white">সাপোর্ট সেন্টার</button></li>
                <li><a href="#" className="text-sm font-bold opacity-60 hover:opacity-100 hover:text-[#7B61FF] transition-all text-white">শর্তাবলী</a></li>
                <li><a href="#" className="text-sm font-bold opacity-60 hover:opacity-100 hover:text-[#7B61FF] transition-all text-white">প্রাইভেসি পলিসি</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-30 text-white">
              © 2025 {branding.appName}. All Rights Reserved.
            </p>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-30 text-white">
              Made with <i className="fa-solid fa-heart text-[#FF3B30] mx-1"></i> by Vercel Pro Engine
            </p>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Nav */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 h-20 flex justify-between items-center px-8 z-[1000] backdrop-blur-xl border-t transition-colors rounded-t-[2rem] bg-[#1C1C1E]/95 border-white/5 text-white shadow-2xl`}>
        <MobileNavItem to="/" icon="fa-house" label="হোম" active={isActive('/')} />
        <MobileNavItem to="/wallet" icon="fa-wallet" label="ওয়ালেট" active={isActive('/wallet')} />
        
        <div className="relative -top-8">
          <Link to="/add-money" className="w-16 h-16 bg-[#7B61FF] rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(123,97,255,0.6)] border-[6px] border-black transition-transform active:scale-90">
            <i className="fa-solid fa-plus text-white text-2xl"></i>
          </Link>
          <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-[#7B61FF] uppercase tracking-wider">অ্যাড</span>
        </div>

        <MobileNavItem to="/orders" icon="fa-receipt" label="অর্ডার" active={isActive('/orders')} />
        <MobileNavItem to="/profile" icon="fa-regular fa-user" label="প্রোফাইল" active={isActive('/profile')} />
      </nav>

      {/* Floating Support */}
      <SupportChat isDarkMode={isDarkMode} />
    </div>
  );
};

const DesktopNavItem: React.FC<{ to: string, label: string, active: boolean }> = ({ to, label, active }) => (
  <Link 
    to={to} 
    className={`text-sm font-bold transition-all px-4 py-2 rounded-xl text-white ${active ? 'bg-[#7B61FF0D] border border-[#7B61FF33]' : 'opacity-60 hover:opacity-100 hover:bg-white/5'}`}
  >
    {label}
  </Link>
);

const MobileNavItem: React.FC<{ to: string, icon: string, label: string, active: boolean }> = ({ to, icon, label, active }) => (
  <Link to={to} className={`flex flex-col items-center justify-center w-12 gap-1.5 transition-all ${active ? 'text-[#7B61FF] -translate-y-1' : 'text-white/40'}`}>
    <i className={`fa-solid ${icon} text-xl`}></i>
    <span className="text-[10px] font-bold">{label}</span>
  </Link>
);

export default Layout;
