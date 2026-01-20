
import React, { useState } from 'react';
import { Shop, UserProfile, Language } from '../types';
import { translations } from '../translations';

interface SidebarProps {
  currentView: string;
  setView: (view: any) => void;
  shop: Shop;
  user: UserProfile;
  lang: Language;
  setLang: (lang: Language) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, shop, user, lang, setLang }) => {
  const t = translations[lang].sidebar;
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: t.dashboard, icon: '📊' },
    { id: 'onboarding', label: t.aiStudio, icon: '✨' },
    { id: 'inventory', label: t.catalog, icon: '🛍️' },
    { id: 'orders', label: t.orders, icon: '📦' },
    { id: 'settings', label: t.integrations, icon: '🔗' },
  ];

  const handleNav = (id: any) => {
    setView(id);
    setIsOpen(false);
  };

  return (
    <>
      {/* Burger Menu for TWA Mobile */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-6 right-6 z-[100] w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center shadow-2xl active:scale-90 transition-all"
      >
        {isOpen ? '✕' : '☰'}
      </button>

      <div className={`fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-100 flex flex-col z-50 transition-transform lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-black rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-lg">B</div>
            <div>
              <h1 className="font-black text-gray-900 leading-tight text-lg">Bazary</h1>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{t.aiContentStudio}</p>
            </div>
          </div>

          <nav className="space-y-2">
            {menuItems.map(item => (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
                  currentView === item.id
                    ? 'bg-blue-50 text-blue-700 shadow-sm'
                    : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-8 space-y-4">
          <div className="flex bg-gray-100 p-1 rounded-2xl mb-4">
            <button onClick={() => setLang('ru')} className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all ${lang === 'ru' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}>РУС</button>
            <button onClick={() => setLang('uz')} className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all ${lang === 'uz' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}>UZB</button>
          </div>

          <div className="bg-gray-50 rounded-[2rem] p-5 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-black text-blue-600 text-xs uppercase">
                {user.fullName ? user.fullName.split(' ').map(n => n[0]).join('') : 'U'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-black text-gray-900 truncate">{user.fullName}</p>
                <p className="text-[10px] text-gray-400 font-bold truncate">{user.email || 'Active Session'}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-600 rounded-[2rem] p-5 text-white shadow-lg shadow-blue-100">
            <p className="text-[9px] font-black uppercase tracking-widest mb-1 opacity-70">{t.activeBusiness}</p>
            <p className="text-xs font-bold truncate">@{shop.username}</p>
          </div>
        </div>
      </div>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-[40]"
        />
      )}
    </>
  );
};

export default Sidebar;
