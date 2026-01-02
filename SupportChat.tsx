
import React, { useState, useEffect, useRef } from 'react';
import { getSupportResponse, sendFunctionResponse } from '../services/gemini';
import { auth, db } from '../services/firebase';
import { doc, getDoc, collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

interface Message {
  text: string;
  sender: 'user' | 'bot';
  timestamp: number;
  role?: 'user' | 'model';
}

const SupportChat: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Keep history for context
  const historyRef = useRef<any[]>([]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcome = "হ্যালো! Vercel Topup BD সাপোর্টে আপনাকে স্বাগতম। আপনার ব্যালেন্স চেক করতে, অর্ডার দেখতে বা যেকোনো প্রশ্নের জন্য আমি এখানে আছি। কীভাবে সাহায্য করতে পারি?";
      setMessages([{
        text: welcome,
        sender: 'bot',
        timestamp: Date.now(),
        role: 'model'
      }]);
      historyRef.current = [{ role: 'model', parts: [{ text: welcome }] }];
    }
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [isOpen, messages]);

  const executeFunction = async (call: any) => {
    const { name, args, id } = call;
    const user = auth.currentUser;

    if (name === 'navigate_to_page') {
      const routes: Record<string, string> = {
        home: '/',
        wallet: '/wallet',
        orders: '/orders',
        profile: '/profile',
        'add-money': '/add-money'
      };
      if (routes[args.page]) {
        navigate(routes[args.page]);
        return { result: "সফলভাবে পাতায় নিয়ে যাওয়া হয়েছে।" };
      }
      return { result: "দুঃখিত, এই পাতাটি খুঁজে পাওয়া যায়নি।" };
    }

    if (!user) return { error: "লগইন করা নেই।" };

    if (name === 'check_wallet_balance') {
      const snap = await getDoc(doc(db, 'users', user.uid));
      return { balance: snap.exists() ? snap.data().walletBalance : 0 };
    }

    if (name === 'get_recent_orders') {
      const q = query(
        collection(db, 'orders'), 
        where('userId', '==', user.uid),
        orderBy('date', 'desc'),
        limit(args.limit || 5)
      );
      const snap = await getDocs(q);
      const orders = snap.docs.map(d => ({
        game: d.data().game,
        package: d.data().package,
        status: d.data().status,
        price: d.data().price
      }));
      return { orders };
    }

    return { error: "Unknown function" };
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMsg: Message = { text: inputValue, sender: 'user', timestamp: Date.now(), role: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    let response = await getSupportResponse(inputValue, historyRef.current);
    
    if (response) {
      historyRef.current.push({ role: 'user', parts: [{ text: userMsg.text }] });
      
      const candidate = response.candidates?.[0];
      const parts = candidate?.content?.parts || [];
      
      for (const part of parts) {
        if (part.text) {
          const botMsg: Message = { text: part.text, sender: 'bot', timestamp: Date.now(), role: 'model' };
          setMessages(prev => [...prev, botMsg]);
          historyRef.current.push({ role: 'model', parts: [{ text: part.text }] });
        }
        
        if (candidate?.functionCalls) {
          for (const call of candidate.functionCalls) {
            const result = await executeFunction(call);
            const finalResponse = await sendFunctionResponse(historyRef.current, call.name, call.id, result);
            
            if (finalResponse?.text) {
              const finalMsg: Message = { text: finalResponse.text, sender: 'bot', timestamp: Date.now(), role: 'model' };
              setMessages(prev => [...prev, finalMsg]);
              historyRef.current.push({ role: 'model', parts: [{ text: finalResponse.text }] });
            }
          }
        }
      }
    } else {
      setMessages(prev => [...prev, { text: "দুঃখিত, আমি এই মুহূর্তে উত্তর দিতে পারছি না।", sender: 'bot', timestamp: Date.now() }]);
    }

    setIsTyping(false);
  };

  return (
    <>
      {/* FAB */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-32 right-5 w-14 h-14 bg-[#7B61FF] rounded-full flex items-center justify-center text-white shadow-lg z-[1001] active:scale-90 transition-transform hover:rotate-12"
      >
        <i className={`fa-solid ${isOpen ? 'fa-xmark' : 'fa-message'} text-2xl`}></i>
      </button>

      {/* Chat Window */}
      <div className={`fixed inset-0 sm:inset-auto sm:right-5 sm:bottom-48 sm:w-[400px] sm:h-[550px] z-[1002] flex flex-col transition-all duration-300 transform rounded-[2.5rem] overflow-hidden shadow-2xl border ${isDarkMode ? 'bg-[#1C1C1E] border-white/10' : 'bg-white border-black/5'} ${isOpen ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-95 pointer-events-none'}`}>
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-[#7B61FF] to-[#9f8eff] text-white flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
            <i className="fa-solid fa-robot text-2xl"></i>
          </div>
          <div className="flex-1">
            <h3 className="font-black tracking-tight">Vercel AI সাপোর্ট</h3>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">অনলাইন (বাংলা)</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="opacity-60 hover:opacity-100 transition-opacity">
            <i className="fa-solid fa-chevron-down"></i>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 flex flex-col scroll-smooth bg-gray-50/50 dark:bg-black/20">
          {messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={`max-w-[85%] p-4 rounded-[1.5rem] text-sm leading-relaxed shadow-sm transition-all animate-fadeIn ${msg.sender === 'user' ? 'bg-[#7B61FF] text-white self-end rounded-br-none' : 'bg-white dark:bg-white/5 text-[#1D1D1F] dark:text-[#F5F5F7] self-start rounded-bl-none border border-black/5 dark:border-white/5'}`}
            >
              <p className="font-medium">{msg.text}</p>
              <p className={`text-[8px] mt-2 opacity-40 uppercase font-black ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                {new Date(msg.timestamp).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          ))}
          {isTyping && (
            <div className="bg-white/40 dark:bg-white/5 p-4 rounded-[1.5rem] self-start rounded-bl-none flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-[#7B61FF] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1.5 h-1.5 bg-[#7B61FF] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1.5 h-1.5 bg-[#7B61FF] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span className="text-[10px] font-bold text-[#7B61FF] uppercase tracking-widest">AI চিন্তা করছে...</span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Footer */}
        <div className="p-6 bg-white dark:bg-[#1C1C1E] border-t border-black/5 dark:border-white/5 flex gap-3">
          <input 
            type="text" 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="আপনার প্রশ্নটি বাংলায় লিখুন..."
            className="flex-1 bg-gray-100 dark:bg-black p-4 rounded-2xl text-sm font-bold outline-none border-2 border-transparent focus:border-[#7B61FF] transition-all"
          />
          <button 
            onClick={handleSend}
            disabled={!inputValue.trim() || isTyping}
            className="w-14 h-14 bg-[#7B61FF] rounded-2xl text-white flex items-center justify-center disabled:opacity-50 transition-all shadow-lg shadow-[#7B61FF44] active:scale-90"
          >
            <i className="fa-solid fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </>
  );
};

export default SupportChat;
