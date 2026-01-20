
import React, { useState, useEffect } from 'react';
import { Product, ProductStatus, Category, Order, Shop, UserProfile, Language } from './types';
import OnboardingView from './views/OnboardingView';
import DashboardView from './views/DashboardView';
import InventoryView from './views/InventoryView';
import OrdersView from './views/OrdersView';
import SettingsView from './views/SettingsView';
import ResearchView from './views/ResearchView';
import Sidebar from './components/Sidebar';
import { translations } from './translations';

declare global {
  interface Window {
    Telegram?: {
      WebApp: any;
    };
  }
}

const App: React.FC = () => {
  const [view, setView] = useState<'onboarding' | 'dashboard' | 'inventory' | 'orders' | 'settings' | 'research'>('dashboard');
  const [lang, setLang] = useState<Language>('ru');
  const [hasSelectedLang, setHasSelectedLang] = useState<boolean>(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [user, setUser] = useState<UserProfile>({
    id: '1',
    fullName: 'New Merchant',
    email: '',
    isRegistered: false
  });
  const [shop, setShop] = useState<Shop>({
    name: "My AI Fashion Shop",
    username: "shop_bot",
    description: "AI-powered fashion boutique.",
    telegramChannelId: "",
    isInstagramConnected: false
  });

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.expand();
      tg.ready();

      const tgUser = tg.initDataUnsafe?.user;
      if (tgUser) {
        const fullName = `${tgUser.first_name || ''} ${tgUser.last_name || ''}`.trim() || tgUser.username || 'TG User';
        setUser(prev => ({
          ...prev,
          id: String(tgUser.id),
          fullName: fullName,
          isRegistered: true
        }));
        setShop(prev => ({
          ...prev,
          username: tgUser.username || prev.username
        }));
      }
      tg.setHeaderColor(tg.themeParams.bg_color || '#ffffff');
    }

    const savedProducts = localStorage.getItem('bazary_products');
    if (savedProducts) setProducts(JSON.parse(savedProducts));
    const savedShop = localStorage.getItem('bazary_shop');
    if (savedShop) setShop(JSON.parse(savedShop));
    const savedUser = localStorage.getItem('bazary_user');
    if (savedUser) setUser(JSON.parse(savedUser));
    const savedLang = localStorage.getItem('bazary_lang') as Language;
    if (savedLang) {
      setLang(savedLang);
      setHasSelectedLang(true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('bazary_products', JSON.stringify(products));
    localStorage.setItem('bazary_shop', JSON.stringify(shop));
    localStorage.setItem('bazary_user', JSON.stringify(user));
    if (hasSelectedLang) localStorage.setItem('bazary_lang', lang);
  }, [products, shop, user, lang, hasSelectedLang]);

  const handleLanguageSelect = (selectedLang: Language) => {
    setLang(selectedLang);
    setHasSelectedLang(true);
  };

  const addProducts = (newProducts: Product[]) => {
    setProducts(prev => [...newProducts, ...prev]);
    setView('inventory');
  };

  const updateProduct = (updated: Product) => {
    setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  if (!hasSelectedLang) {
    return (
      <div className="fixed inset-0 bg-white z-[300] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-[2.5rem] flex items-center justify-center text-white text-4xl font-black mb-12 shadow-2xl animate-bounce">B</div>
        <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Выберите язык</h2>
        <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-12">Tilni tanlang / Select Language</p>
        
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <button onClick={() => handleLanguageSelect('ru')} className="group w-full bg-gray-50 hover:bg-blue-600 hover:text-white border-2 border-gray-100 hover:border-blue-500 py-6 rounded-[2rem] transition-all duration-300 flex items-center justify-between px-8">
            <span className="text-lg font-black tracking-tight">Русский</span>
            <span className="text-2xl group-hover:scale-125 transition-transform">🇷🇺</span>
          </button>
          <button onClick={() => handleLanguageSelect('uz')} className="group w-full bg-gray-50 hover:bg-blue-600 hover:text-white border-2 border-gray-100 hover:border-blue-500 py-6 rounded-[2rem] transition-all duration-300 flex items-center justify-between px-8">
            <span className="text-lg font-black tracking-tight">O'zbekcha</span>
            <span className="text-2xl group-hover:scale-125 transition-transform">🇺🇿</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar 
        currentView={view} 
        setView={setView} 
        shop={shop} 
        user={user} 
        lang={lang} 
        setLang={setLang} 
      />
      
      <main className="flex-1 lg:ml-64 p-6 lg:p-12 overflow-y-auto">
        {!user.isRegistered && (
          <div className="fixed inset-0 bg-white z-[100] flex items-center justify-center p-6">
            <div className="max-w-md w-full text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-[2rem] mx-auto flex items-center justify-center text-white text-3xl font-black mb-8 shadow-2xl">B</div>
              <h2 className="text-3xl font-black mb-3">{lang === 'ru' ? 'Создать Магазин' : 'Do\'kon yaratish'}</h2>
              <div className="space-y-4 text-left mt-10">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-4">{lang === 'ru' ? 'Имя мерчанта' : 'Merchant ismi'}</label>
                  <input placeholder="e.g. Aziz Designer" value={user.fullName} className="w-full bg-gray-50 border-2 border-gray-50 focus:border-blue-500 rounded-2xl px-6 py-5 font-bold outline-none transition-all" onChange={(e) => setUser({...user, fullName: e.target.value})} />
                </div>
                <button onClick={() => setUser({...user, isRegistered: true})} className="w-full bg-blue-600 text-white py-6 rounded-[2rem] font-black uppercase tracking-widest shadow-2xl mt-6 hover:bg-blue-700 transition-all">
                  {lang === 'ru' ? 'Запустить Студию' : 'Studiyani ishga tushirish'}
                </button>
              </div>
            </div>
          </div>
        )}

        {view === 'onboarding' && <OnboardingView onComplete={addProducts} lang={lang} />}
        {view === 'dashboard' && <DashboardView products={products} orders={orders} onStartOnboarding={() => setView('onboarding')} lang={lang} />}
        {view === 'inventory' && <InventoryView products={products} onUpdate={updateProduct} onDelete={deleteProduct} shop={shop} lang={lang} />}
        {view === 'orders' && <OrdersView orders={orders} lang={lang} />}
        {view === 'settings' && <SettingsView shop={shop} setShop={setShop} user={user} setUser={setUser} lang={lang} />}
        {view === 'research' && <ResearchView lang={lang} />}
      </main>
    </div>
  );
};

export default App;
