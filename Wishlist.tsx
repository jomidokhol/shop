
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../services/firebase';
import { doc, onSnapshot, collection, query, where, getDocs, updateDoc, arrayRemove } from 'firebase/firestore';
import { Game, UserData } from '../types';

const Wishlist: React.FC = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [wishlistGames, setWishlistGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) {
      navigate('/login');
      return;
    }

    const unsubUser = onSnapshot(doc(db, 'users', auth.currentUser.uid), (snap) => {
      if (snap.exists()) {
        const uData = snap.data() as UserData;
        setUserData(uData);
        fetchGames(uData.wishlist || []);
      }
    });

    return () => unsubUser();
  }, [navigate]);

  const fetchGames = async (ids: string[]) => {
    if (ids.length === 0) {
      setWishlistGames([]);
      setLoading(false);
      return;
    }

    try {
      const q = query(collection(db, 'games'), where('__name__', 'in', ids));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Game));
      setWishlistGames(list);
    } catch (err) {
      console.error("Wishlist fetch error:", err);
    }
    setLoading(false);
  };

  const removeFromWishlist = async (e: React.MouseEvent, gameId: string) => {
    e.stopPropagation();
    if (!auth.currentUser) return;
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        wishlist: arrayRemove(gameId)
      });
    } catch (err) {
      console.error(err);
    }
  };

  const selectGame = (game: Game) => {
    localStorage.setItem('selectedGame', JSON.stringify(game));
    navigate('/topup');
  };

  return (
    <div className="space-y-10 pb-20 text-white max-w-7xl mx-auto">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/profile')} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shadow-sm hover:bg-white/20 transition-colors">
          <i className="fa-solid fa-arrow-left text-white"></i>
        </button>
        <h2 className="text-3xl font-black text-white">আমার উইশলিস্ট</h2>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-60 bg-white/5 rounded-3xl animate-skeleton"></div>
          ))}
        </div>
      ) : wishlistGames.length === 0 ? (
        <div className="text-center py-32 space-y-6 opacity-30 flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
            <i className="fa-solid fa-heart-crack text-5xl"></i>
          </div>
          <p className="font-black uppercase tracking-[0.3em] text-xs">আপনার উইশলিস্ট এখন খালি</p>
          <button 
            onClick={() => navigate('/')}
            className="px-8 py-3 bg-[#7B61FF] text-white rounded-full font-bold opacity-100 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#7B61FF44]"
          >
            গেম খুঁজুন
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {wishlistGames.map(game => (
            <div 
              key={game.id} 
              onClick={() => selectGame(game)}
              className="group relative bg-white/5 rounded-[2rem] overflow-hidden border border-white/10 transition-all hover:border-[#7B61FF44] hover:shadow-2xl cursor-pointer"
            >
              <button 
                onClick={(e) => removeFromWishlist(e, game.id)}
                className="absolute top-3 left-3 w-8 h-8 rounded-xl bg-red-500 text-white flex items-center justify-center z-20 shadow-lg"
              >
                <i className="fa-solid fa-heart text-xs"></i>
              </button>
              
              <div className="h-40 p-4 flex items-center justify-center bg-black/20">
                <img src={game.logo} alt={game.name} className="max-w-full max-h-full object-contain drop-shadow-md transition-transform group-hover:scale-110" />
              </div>
              
              <div className="p-4 text-center">
                <p className="text-sm font-bold truncate text-white">{game.name}</p>
                <p className="text-[10px] font-black uppercase opacity-40 mt-1 text-white">{game.category}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
