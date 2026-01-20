
import React, { useState } from 'react';
import { Shop, UserProfile, Language } from '../types';
import { translations } from '../translations';

interface SettingsViewProps {
  shop: Shop;
  setShop: (shop: Shop) => void;
  user: UserProfile;
  setUser: (user: UserProfile) => void;
  lang: Language;
}

const SettingsView: React.FC<SettingsViewProps> = ({ shop, setShop, user, setUser, lang }) => {
  const t = translations[lang].settings;
  const [activeTab, setActiveTab] = useState<'profile' | 'general' | 'telegram' | 'channel' | 'instagram'>('profile');

  const tabs = [
    { id: 'profile', label: t.tabs.profile, icon: '👤' },
    { id: 'general', label: t.tabs.store, icon: '🏪' },
    { id: 'telegram', label: t.tabs.bot, icon: '🤖' },
    { id: 'channel', label: t.tabs.channel, icon: '📢' },
    { id: 'instagram', label: t.tabs.instagram, icon: '📸' },
  ] as const;

  return (
    <div className="max-w-2xl mx-auto animate-in">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-gray-900">{t.title}</h2>
        <p className="text-gray-500 font-medium">{t.subtitle}</p>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
        <div className="flex border-b border-gray-50 overflow-x-auto no-scrollbar bg-gray-50/50">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-none px-6 py-5 text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                activeTab === tab.id ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-gray-400'
              }`}
            >
              <span className="text-base">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-8 space-y-6">
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="flex items-center gap-6 mb-8">
                <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center text-3xl shadow-inner">👤</div>
                <div>
                  <h4 className="font-black text-gray-900 text-sm mb-1">{t.profile.avatar}</h4>
                  <button className="text-blue-600 text-[10px] font-black uppercase tracking-widest">{t.profile.change}</button>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">{t.profile.name}</label>
                <input 
                  className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 mt-1 font-bold outline-none"
                  value={user.fullName}
                  onChange={e => setUser({...user, fullName: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">{t.profile.email}</label>
                <input 
                  className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 mt-1 font-bold outline-none"
                  value={user.email}
                  onChange={e => setUser({...user, email: e.target.value})}
                />
              </div>
            </div>
          )}

          {activeTab === 'general' && (
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">{t.store.name}</label>
                <input 
                  className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 mt-1 font-bold outline-none"
                  value={shop.name}
                  onChange={e => setShop({...shop, name: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">{t.store.username}</label>
                <input 
                  className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 mt-1 font-bold outline-none"
                  value={shop.username}
                  onChange={e => setShop({...shop, username: e.target.value})}
                />
              </div>
            </div>
          )}

          {activeTab === 'telegram' && (
            <div className="space-y-6">
              <div className="bg-blue-50 p-6 rounded-3xl flex items-center gap-4">
                <div className="text-3xl">🤖</div>
                <div>
                  <h4 className="font-black text-blue-900 text-sm">{t.telegram.title}</h4>
                  <p className="text-xs text-blue-700 font-medium">{t.telegram.desc}</p>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">{t.telegram.token}</label>
                <input 
                  type="password"
                  placeholder="123456:ABC-DEF..."
                  className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 mt-1 font-mono text-xs outline-none"
                  value={shop.telegramToken || ''}
                  onChange={e => setShop({...shop, telegramToken: e.target.value})}
                />
                <p className="text-[9px] text-gray-400 font-bold mt-2 px-1">{t.telegram.tokenDesc}</p>
              </div>
              <button className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all">
                {t.telegram.update}
              </button>
            </div>
          )}

          {activeTab === 'channel' && (
            <div className="space-y-6">
              <div className="bg-cyan-50 p-6 rounded-3xl flex items-center gap-4">
                <div className="text-3xl">📢</div>
                <div>
                  <h4 className="font-black text-cyan-900 text-sm">{t.channel.title}</h4>
                  <p className="text-xs text-cyan-700 font-medium">{t.channel.desc}</p>
                </div>
              </div>

              {/* Helpful Checklist */}
              <div className="bg-gray-900 text-white p-6 rounded-[2rem] space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-2">Чек-лист подключения:</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-[11px] font-bold">
                    <span className="w-5 h-5 bg-white/10 rounded-full flex items-center justify-center text-[10px]">1</span>
                    <span>Добавьте бота в ваш канал</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-bold">
                    <span className="w-5 h-5 bg-white/10 rounded-full flex items-center justify-center text-[10px]">2</span>
                    <span>Назначьте бота <b>Администратором</b></span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-bold">
                    <span className="w-5 h-5 bg-white/10 rounded-full flex items-center justify-center text-[10px]">3</span>
                    <span>Для приватных каналов ID должен начинаться с <code className="bg-white/20 px-1 rounded">-100</code></span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">{t.channel.link}</label>
                <input 
                  placeholder="@my_awesome_channel"
                  className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 mt-1 font-bold outline-none"
                  value={shop.telegramChannelId || ''}
                  onChange={e => setShop({...shop, telegramChannelId: e.target.value})}
                />
                <p className="text-[9px] text-gray-400 font-bold mt-2 px-1">{t.channel.tip}</p>
              </div>
              <button className="w-full bg-cyan-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all">
                {t.channel.sync}
              </button>
            </div>
          )}

          {activeTab === 'instagram' && (
            <div className="space-y-6">
              <div className="bg-pink-50 p-6 rounded-3xl flex items-center gap-4">
                <div className="text-3xl">📸</div>
                <div>
                  <h4 className="font-black text-pink-900 text-sm">{t.instagram.title}</h4>
                  <p className="text-xs text-pink-700 font-medium">{t.instagram.desc}</p>
                </div>
              </div>
              
              {!shop.isInstagramConnected ? (
                <div className="text-center py-4">
                  <p className="text-xs text-gray-500 mb-6 font-medium px-4">{t.instagram.desc}</p>
                  <button 
                    onClick={() => setShop({...shop, isInstagramConnected: true})}
                    className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                  >
                    {t.instagram.connect}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl border border-pink-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">📷</div>
                      <p className="text-xs font-black">{t.instagram.connected} @{shop.username}_insta</p>
                    </div>
                    <button onClick={() => setShop({...shop, isInstagramConnected: false})} className="text-[10px] font-black text-red-500 uppercase">{t.instagram.disconnect}</button>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-green-50 p-3 rounded-xl border border-green-100 text-center">
                       <p className="text-[8px] font-black text-green-600 uppercase">{t.instagram.feedSync}</p>
                       <p className="text-[10px] font-black">{t.instagram.active}</p>
                    </div>
                    <div className="flex-1 bg-green-50 p-3 rounded-xl border border-green-100 text-center">
                       <p className="text-[8px] font-black text-green-600 uppercase">{t.instagram.storiesSync}</p>
                       <p className="text-[10px] font-black">{t.instagram.active}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
