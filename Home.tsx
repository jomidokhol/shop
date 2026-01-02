
import React, { useState, useEffect } from 'react';
import { db, auth } from '../services/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { Game, UserData } from '../types';
import { useNavigate } from 'react-router-dom';

interface PopupData {
  active: boolean;
  title: string;
  message: string;
  imageUrl?: string;
  buttonText?: string;
  buttonLink?: string;
}

interface EventData {
  active: boolean;
  title: string;
  description: string;
  deadline: any; // Firestore Timestamp
  imageUrl?: string;
  buttonText?: string;
  buttonLink?: string;
}

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [games, setGames] = useState<Game[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [sliderImages, setSliderImages] = useState<string[]>([]);
  const [notice, setNotice] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingGames, setLoadingGames] = useState(true);
  
  // Popup States
  const [popupData, setPopupData] = useState<PopupData | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  // Event States
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const gamesRef = collection(db, 'games');
    const q = query(gamesRef, where('status', 'in', ['active', 'unavailable']));
    const unsubscribeGames = onSnapshot(q, (snapshot) => {
      const gameList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Game));
      setGames(gameList.sort((a, b) => (a.rank || 999) - (b.rank || 999)));
      setError(null);
      setLoadingGames(false);
    }, (err) => {
      console.error("Games fetch error:", err);
      setError("গেম তালিকা লোড করতে সমস্যা হচ্ছে।");
      setLoadingGames(false);
    });

    const sliderDoc = doc(db, 'settings', 'slider');
    const unsubscribeSlider = onSnapshot(sliderDoc, (snapshot) => {
      if (snapshot.exists()) setSliderImages(snapshot.data().imageUrls || []);
    }, (err) => console.error("Slider fetch error:", err));

    const noticeDoc = doc(db, 'settings', 'notice');
    const unsubscribeNotice = onSnapshot(noticeDoc, (snapshot) => {
      if (snapshot.exists()) setNotice(snapshot.data().text || '');
    }, (err) => console.error("Notice fetch error:", err));

    // Popup Sync
    const popupDoc = doc(db, 'settings', 'popup');
    const unsubscribePopup = onSnapshot(popupDoc, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as PopupData;
        setPopupData(data);
        if (data.active) {
          setTimeout(() => setIsPopupOpen(true), 1000);
        }
      }
    }, (err) => console.error("Popup fetch error:", err));

    // Event Sync
    const eventDoc = doc(db, 'settings', 'event');
    const unsubscribeEvent = onSnapshot(eventDoc, (snapshot) => {
      if (snapshot.exists()) {
        setEventData(snapshot.data() as EventData);
      }
    });

    // User Data Sync (for wishlist state)
    let unsubscribeUser = () => {};
    if (auth.currentUser) {
      unsubscribeUser = onSnapshot(doc(db, 'users', auth.currentUser.uid), (snap) => {
        if (snap.exists()) setUserData(snap.data() as UserData);
      });
    }

    return () => {
      unsubscribeGames();
      unsubscribeSlider();
      unsubscribeNotice();
      unsubscribePopup();
      unsubscribeEvent();
      unsubscribeUser();
    };
  }, []);

  // Timer logic
  useEffect(() => {
    if (!eventData?.active || !eventData?.deadline) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const target = eventData.deadline.toDate().getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        clearInterval(interval);
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [eventData]);

  useEffect(() => {
    if (sliderImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % sliderImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [sliderImages]);

  const toggleWishlist = async (e: React.MouseEvent, gameId: string) => {
    e.stopPropagation();
    if (!auth.currentUser) {
      navigate('/login');
      return;
    }

    const userRef = doc(db, 'users', auth.currentUser.uid);
    const isInWishlist = userData?.wishlist?.includes(gameId);

    try {
      if (isInWishlist) {
        await updateDoc(userRef, { wishlist: arrayRemove(gameId) });
      } else {
        await updateDoc(userRef, { wishlist: arrayUnion(gameId) });
      }
    } catch (err) {
      console.error("Wishlist toggle error:", err);
    }
  };

  // Enhanced search to include category discoverability
  const filteredGames = games.filter(game => 
    game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (game.category && game.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const groupedGames = filteredGames.reduce((acc: any, game) => {
    const category = game.category || 'জনপ্রিয় গেমসমূহ';
    if (!acc[category]) acc[category] = [];
    acc[category].push(game);
    return acc;
  }, {});

  const selectGame = (game: Game) => {
    localStorage.setItem('selectedGame', JSON.stringify(game));
    navigate('/topup');
  };

  const GameSkeleton = () => (
    <div className="bg-white/5 rounded-3xl overflow-hidden shadow-sm border border-white/10 flex flex-col animate-skeleton">
      <div className="h-40 md:h-48 bg-white/5"></div>
      <div className="p-4 bg-white/5 border-t border-white/5">
        <div className="h-4 w-3/4 bg-white/5 rounded-full mx-auto"></div>
      </div>
    </div>
  );

  const TimeUnit = ({ value, label }: { value: number, label: string }) => (
    <div className="flex flex-col items-center">
      <div className="bg-white/10 backdrop-blur-md w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center border border-white/20 shadow-inner">
        <span className="text-xl md:text-2xl font-black text-white">{value.toString().padStart(2, '0')}</span>
      </div>
      <span className="text-[10px] md:text-xs font-black uppercase tracking-widest mt-2 text-white/60">{label}</span>
    </div>
  );

  return (
    <div className="space-y-10 pb-10 text-white">
      {/* Announcement Popup Modal */}
      {isPopupOpen && popupData && (
        <div className="fixed inset-0 z-[2001] flex items-center justify-center p-6 animate-fadeIn">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => setIsPopupOpen(false)}
          ></div>
          <div className="bg-[#1C1C1E] w-full max-w-lg rounded-[3rem] overflow-hidden shadow-2xl relative z-10 transform transition-all scale-100 animate-fadeInUp border border-white/10">
            <button 
              onClick={() => setIsPopupOpen(false)}
              className="absolute top-5 right-5 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-xl transition-colors z-20 text-white"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
            {popupData.imageUrl && (
              <div className="h-56 overflow-hidden">
                <img src={popupData.imageUrl} alt="Announcement" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-8 space-y-4 text-center">
              <h3 className="text-2xl font-black tracking-tight text-white">{popupData.title}</h3>
              <p className="text-sm font-medium opacity-70 leading-relaxed whitespace-pre-wrap text-white">{popupData.message}</p>
              <div className="pt-4 flex flex-col gap-3">
                {popupData.buttonLink && (
                  <button 
                    onClick={() => {
                      if (popupData.buttonLink?.startsWith('http')) {
                        window.open(popupData.buttonLink, '_blank');
                      } else {
                        navigate(popupData.buttonLink || '/');
                        setIsPopupOpen(false);
                      }
                    }}
                    className="w-full bg-[#7B61FF] text-white py-4 rounded-2xl font-black shadow-lg shadow-[#7B61FF4D] active:scale-95 transition-all"
                  >
                    {popupData.buttonText || 'বিস্তারিত দেখুন'}
                  </button>
                )}
                <button onClick={() => setIsPopupOpen(false)} className="w-full py-4 bg-white/5 rounded-2xl text-xs font-black uppercase tracking-widest opacity-60 hover:opacity-100 transition-all text-white">বন্ধ করুন</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Special Event Section */}
      {eventData?.active && (
        <div className="relative group overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#7B61FF] via-[#9f8eff] to-[#FF3B30] p-1 shadow-2xl animate-fadeIn">
          <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]"></div>
          
          <div className="relative bg-[#0A0A0B] rounded-[2.4rem] overflow-hidden flex flex-col lg:flex-row items-center">
            {/* Event Media */}
            <div className="w-full lg:w-1/2 h-48 lg:h-80 overflow-hidden relative">
              <img 
                src={eventData.imageUrl || "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop"} 
                alt="Event" 
                className="w-full h-full object-cover opacity-60 transition-transform duration-1000 group-hover:scale-110" 
              />
              <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-black via-black/40 to-transparent"></div>
              
              <div className="absolute top-6 left-6 flex items-center gap-3">
                <div className="bg-[#FF3B30] text-white text-[10px] font-black px-3 py-1.5 rounded-full flex items-center gap-2 animate-pulse shadow-lg">
                   <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                   LIMITED TIME EVENT
                </div>
              </div>
            </div>

            {/* Event Content */}
            <div className="w-full lg:w-1/2 p-8 lg:p-12 space-y-6 flex flex-col justify-center">
              <div className="space-y-2">
                <h2 className="text-2xl lg:text-3xl font-black text-white tracking-tight">{eventData.title}</h2>
                <p className="text-white/60 text-sm font-medium leading-relaxed max-w-md">{eventData.description}</p>
              </div>

              {/* Timer UI */}
              <div className="flex gap-4 py-2">
                <TimeUnit value={timeLeft.days} label="দিন" />
                <TimeUnit value={timeLeft.hours} label="ঘন্টা" />
                <TimeUnit value={timeLeft.minutes} label="মিনিট" />
                <TimeUnit value={timeLeft.seconds} label="সেকেন্ড" />
              </div>

              <div className="pt-4">
                <button 
                  onClick={() => {
                    if (eventData.buttonLink?.startsWith('http')) {
                      window.open(eventData.buttonLink, '_blank');
                    } else {
                      navigate(eventData.buttonLink || '/');
                    }
                  }}
                  className="px-10 py-4 bg-gradient-to-r from-[#7B61FF] to-[#9f8eff] text-white rounded-2xl font-black text-sm shadow-xl shadow-[#7B61FF44] active:scale-95 transition-all hover:shadow-[#7B61FF66] hover:-translate-y-1"
                >
                  {eventData.buttonText || 'অফারটি নিন'}
                </button>
              </div>
            </div>

            {/* Background Decoration */}
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#7B61FF]/20 rounded-full blur-[60px] pointer-events-none"></div>
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-[#FF3B30]/20 rounded-full blur-[60px] pointer-events-none"></div>
          </div>
        </div>
      )}

      {error && (
        <div className="max-w-md mx-auto bg-red-900/20 border border-red-800 p-4 rounded-xl text-red-400 text-sm font-bold animate-shake text-center">
          {error}
        </div>
      )}

      {/* Marquee */}
      <div className="bg-white/5 py-2 px-1 rounded-xl shadow-sm overflow-hidden whitespace-nowrap relative border border-white/10">
        <div className="animate-marquee inline-block text-sm font-medium text-white">
          {notice} <span className="mx-4 text-[#FF3B30] font-bold">|</span> {notice}
        </div>
      </div>

      {/* Slider */}
      <div className="relative h-44 md:h-64 lg:h-80 w-full rounded-2xl overflow-hidden shadow-lg border border-white/5 bg-gray-900">
        <div 
          className="flex h-full transition-transform duration-700 ease-in-out" 
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {sliderImages.length > 0 ? (
            sliderImages.map((url, idx) => (
              <img key={idx} src={url} alt="Promo" className="min-w-full h-full object-cover" />
            ))
          ) : (
            <div className="min-w-full h-full animate-skeleton bg-gray-800"></div>
          )}
        </div>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
          {sliderImages.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentSlide ? 'w-6 bg-[#7B61FF]' : 'w-1.5 bg-white/50'}`}
            ></div>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-2xl mx-auto w-full px-2">
        <div className="relative group">
          <i className="fa-solid fa-magnifying-glass absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#7B61FF] transition-colors"></i>
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="গেম বা ক্যাটাগরি দিয়ে খুঁজুন..."
            className="w-full bg-white/5 py-4 pl-14 pr-6 rounded-2xl border border-white/10 shadow-sm outline-none focus:ring-2 focus:ring-[#7B61FF] transition-all font-medium text-white"
          />
        </div>
      </div>

      {/* Game Categories */}
      {loadingGames ? (
        <section className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-8 w-40 bg-white/5 rounded-lg animate-skeleton"></div>
            <div className="flex-1 h-px bg-white/10"></div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(i => <GameSkeleton key={i} />)}
          </div>
        </section>
      ) : Object.keys(groupedGames).length > 0 ? (
        Object.keys(groupedGames).map(category => (
          <section key={category} className="space-y-6">
            <div className="flex items-center gap-4">
              <h2 className="text-xl md:text-2xl font-black tracking-tight text-white">{category}</h2>
              <div className="flex-1 h-px bg-white/10"></div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
              {groupedGames[category].map((game: Game) => {
                const isFavorite = userData?.wishlist?.includes(game.id);
                return (
                  <div 
                    key={game.id} 
                    onClick={() => selectGame(game)}
                    className={`group relative bg-white/5 rounded-3xl overflow-hidden shadow-sm border border-white/10 transition-all hover:shadow-xl hover:-translate-y-1 active:scale-95 flex flex-col ${game.status === 'unavailable' ? 'opacity-70 pointer-events-none' : 'cursor-pointer'}`}
                  >
                    {/* Wishlist Toggle */}
                    <button 
                      onClick={(e) => toggleWishlist(e, game.id)}
                      className={`absolute top-3 left-3 w-8 h-8 rounded-xl backdrop-blur-md flex items-center justify-center transition-all z-20 shadow-lg ${isFavorite ? 'bg-red-500 text-white' : 'bg-black/40 text-white/60 hover:text-white'}`}
                    >
                      <i className={`${isFavorite ? 'fa-solid' : 'fa-regular'} fa-heart text-xs`}></i>
                    </button>

                    {game.badgeText && (
                      <span className="absolute top-0 right-0 bg-[#7B61FF] text-white text-[10px] font-bold py-1 px-3 rounded-bl-xl z-10 shadow-sm overflow-hidden">
                        {game.badgeText}
                        <div className="absolute inset-0 bg-white/20 -skew-x-12 translate-x-[-150%] animate-[glassReflect_3s_infinite]"></div>
                      </span>
                    )}
                    {game.status === 'unavailable' && (
                      <div className="absolute inset-0 bg-black/50 z-20 flex items-center justify-center p-8 backdrop-blur-[2px]">
                        <img src="https://i.postimg.cc/66S03X9x/1000020217-removebg-preview.png" alt="Sold Out" className="w-full h-auto drop-shadow-lg" />
                      </div>
                    )}
                    <div className="h-40 md:h-48 p-4 flex items-center justify-center bg-black/20">
                      <img src={game.logo} alt={game.name} className="max-w-full max-h-full object-contain drop-shadow-md transition-transform group-hover:scale-105" />
                    </div>
                    <div className="p-4 bg-white/5 border-t border-white/5 text-center">
                      <span className="text-sm font-bold truncate block text-white group-hover:text-[#7B61FF] transition-colors">{game.name}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))
      ) : (
        <div className="text-center py-20 opacity-40">
           <i className="fa-solid fa-ghost text-6xl mb-4 text-white"></i>
           <p className="text-lg font-bold text-white">দুঃখিত, কোনো গেম পাওয়া যায়নি!</p>
        </div>
      )}
    </div>
  );
};

export default Home;
