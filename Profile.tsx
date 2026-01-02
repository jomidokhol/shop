
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../services/firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { UserData } from '../types';

interface ProfileProps {
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
}

const Profile: React.FC<ProfileProps> = ({ isDarkMode, setIsDarkMode }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [userData, setUserData] = useState<UserData | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhoto, setEditPhoto] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const unsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
        if (snap.exists()) {
          const data = snap.data() as UserData;
          setUserData(data);
          setEditName(data.name);

          if (!data.referralCode) {
            const newCode = `TOPUP-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
            updateDoc(doc(db, 'users', user.uid), { referralCode: newCode, referralCount: 0 });
          }
        }
      });
      return () => unsub();
    }
  }, []);

  const handleLogout = () => {
    auth.signOut().then(() => navigate('/login'));
  };

  const copyCode = () => {
    if (userData?.referralCode) {
      navigator.clipboard.writeText(userData.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleImageClick = () => {
    if (isEditing) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    if (!userData) return;
    if (!editName.trim()) {
      alert("নাম অবশ্যই দিতে হবে।");
      return;
    }

    setIsSaving(true);
    try {
      const updates: any = { name: editName };
      if (editPhoto) {
        updates.photoURL = editPhoto;
      }
      await updateDoc(doc(db, 'users', userData.uid), updates);
      setIsEditing(false);
      setEditPhoto(null);
    } catch (err) {
      console.error("Profile update error:", err);
      alert("তথ্য আপডেট করতে সমস্যা হয়েছে।");
    }
    setIsSaving(false);
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto pb-20 text-white">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-2xl font-black tracking-tight text-white">প্রোফাইল</h2>
        <button 
          onClick={() => {
            if (isEditing) {
              setEditName(userData?.name || '');
              setEditPhoto(null);
              setIsEditing(false);
            } else {
              setIsEditing(true);
            }
          }}
          className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${isEditing ? 'bg-red-500 text-white' : 'bg-[#7B61FF] text-white'}`}
        >
          {isEditing ? 'বাতিল' : 'এডিট'}
        </button>
      </div>

      <div className="flex flex-col items-center gap-5 py-8 bg-white/5 backdrop-blur-md rounded-[3.5rem] shadow-sm border border-white/10 relative overflow-hidden transition-all duration-500">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#7B61FF] to-[#FF3B30]"></div>
        
        <div className="relative group">
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
          <div onClick={handleImageClick} className={`relative rounded-full p-1.5 border-4 transition-all duration-300 ${isEditing ? 'border-[#7B61FF] cursor-pointer hover:scale-105 active:scale-95' : 'border-white/20'}`}>
            <img src={editPhoto || userData?.photoURL || "https://i.ibb.co/74CkxSP/avatar.png"} alt="Avatar" className="w-32 h-32 rounded-full object-cover shadow-2xl" />
          </div>
        </div>

        <div className="text-center space-y-4 w-full px-8">
          <h3 className="text-2xl font-black tracking-tight text-white">{userData?.name || 'লোড হচ্ছে...'}</h3>
          <p className="text-xs font-bold opacity-60 uppercase tracking-widest text-white">{userData?.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {userData?.role === 'admin' && (
          <div className="grid grid-cols-2 gap-4">
            <MenuButton icon="fa-shield-halved" label="পেমেন্ট মেথড" onClick={() => navigate('/admin/payment-methods')} className="border-[#7B61FF22] bg-[#7B61FF15]" />
            <MenuButton icon="fa-tags" label="কুপন/ভাউচার" onClick={() => navigate('/admin/vouchers')} className="border-[#7B61FF22] bg-[#7B61FF15]" />
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
           <MenuButton icon="fa-wallet" label="ওয়ালেট" onClick={() => navigate('/wallet')} />
           <MenuButton icon="fa-receipt" label="অর্ডার" onClick={() => navigate('/orders')} />
        </div>
        <div className="grid grid-cols-1">
          <MenuButton icon="fa-heart" label="আমার উইশলিস্ট" onClick={() => navigate('/wishlist')} className="bg-[#FF3B300D] border-red-500/10" />
        </div>
        <MenuButton icon="fa-cogs" label="থিম ও সেটিংস" onClick={() => setShowSettings(!showSettings)} />
        <MenuButton icon="fa-right-from-bracket" label="লগ আউট" onClick={handleLogout} className="text-[#FF3B30] bg-red-950/20" />
      </div>

      {showSettings && (
        <div className="p-8 bg-white/5 backdrop-blur-md rounded-[3rem] shadow-sm border border-white/10 space-y-6 animate-fadeIn">
          <div className="flex justify-between items-center p-4 bg-black/20 rounded-2xl">
            <span className="text-sm font-bold opacity-80 text-white">ডার্ক মোড</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={isDarkMode} onChange={(e) => setIsDarkMode(e.target.checked)} className="sr-only peer" />
              <div className="w-12 h-6 bg-gray-700 rounded-full peer peer-checked:bg-[#7B61FF]"></div>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

const MenuButton: React.FC<{ icon: string, label: string, onClick: () => void, className?: string }> = ({ icon, label, onClick, className = '' }) => (
  <button onClick={onClick} className={`flex items-center gap-4 bg-white/5 p-5 rounded-[2rem] border border-white/10 active:scale-[0.98] transition-all hover:bg-white/10 ${className}`}>
    <div className="w-10 h-10 rounded-xl bg-black/40 flex items-center justify-center"><i className={`fa-solid ${icon} text-lg text-[#7B61FF]`}></i></div>
    <span className="font-bold text-sm text-white">{label}</span>
  </button>
);

export default Profile;
