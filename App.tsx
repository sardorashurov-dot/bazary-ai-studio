
import React, { useState, useEffect } from 'react';
import { Product, ProductStatus, Category, Order, Shop, UserProfile, Language } from './types';
import OnboardingView from './views/OnboardingView';
import DashboardView from './views/DashboardView';
import InventoryView from './views/InventoryView';
import OrdersView from './views/OrdersView';
import SettingsView from './views/SettingsView';
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
  const [view, setView] = useState<'onboarding' | 'dashboard' | 'inventory' | 'orders' | 'settings'>('dashboard');
  const [lang, setLang] = useState<Language>('ru');
  const [hasSelectedLang, setHasSelectedLang] = useState<boolean>(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [apiKey, setApiKey] = useState<string>(process.env.API_KEY || '');
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

  const t = translations[lang];

  useEffect(() => {
    // 1. Initialize Telegram Web App
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.expand(); // Expand to full height
      tg.ready();

      // Auto-fill user from TG
      const tgUser = tg.initDataUnsafe?.user;
      if (tgUser) {
        const fullName = `${tgUser.first_name || ''} ${tgUser.last_name || ''}`.trim() || tgUser.username || 'TG User';
        setUser(prev => ({
          ...prev,
          id: String(tgUser.id),
          fullName: fullName,
          isRegistered: true // Auto-register if coming from TG
        }));
        setShop(prev => ({
          ...prev,
          username: tgUser.username || prev.username
        }));
      }

      // Set header color to match theme
      tg.setHeaderColor(tg.themeParams.bg_color || '#ffffff');
    }

    // 2. Load Local Storage
    const savedProducts = localStorage.getItem('bazary_products');
    if (savedProducts) setProducts(JSON.parse(savedProducts));
    
    const savedShop = localStorage.getItem('bazary_shop');
    if (savedShop) setShop(JSON.parse(savedShop));

    const savedUser = localStorage.getItem('bazary_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser(prev => ({...prev, ...parsed}));
    }
    
    const savedLang = localStorage.getItem('bazary_lang') as Language;
    if (savedLang) {
      setLang(savedLang);
      setHasSelectedLang(true);
    }

    const savedKey = localStorage.getItem('bazary_standalone_key');
    if (savedKey && !process.env.API_KEY) setApiKey(savedKey);
  }, []);

  useEffect(() => {
    localStorage.setItem('bazary_products', JSON.stringify(products));
    localStorage.setItem('bazary_shop', JSON.stringify(shop));
    localStorage.setItem('bazary_user', JSON.stringify(user));
    if (hasSelectedLang) localStorage.setItem('bazary_lang', lang);
    if (apiKey && !process.env.API_KEY) localStorage.setItem('bazary_standalone_key', apiKey);
  }, [products, shop, user, apiKey, lang, hasSelectedLang]);

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

  const showKeyPrompt = !apiKey && !process.env.API_KEY;

  if (!hasSelectedLang) {
    return (
      <div className="fixed inset-0 bg-white z-[300] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-black rounded-[2.5rem] flex items-center justify-center text-white text-4xl font-black mb-12 shadow-2xl animate-bounce">B</div>
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
    <div className="flex min-h-screen bg-tg-theme">
      {/* Sidebar hidden on small screens for TWA mobile feel, or we use a bottom nav / burger later */}
      <Sidebar 
        currentView={view} 
        setView={setView} 
        shop={shop} 
        user={user} 
        lang={lang} 
        setLang={setLang} 
      />
      
      <main className="flex-1 lg:ml-64 p-6 lg:p-12 overflow-y-auto">
        {showKeyPrompt && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[200] flex items-center justify-center p-6 text-center">
            <div className="bg-white rounded-[3rem] p-10 max-w-md w-full shadow-2xl">
              <div className="text-6xl mb-6">🔑</div>
              <h2 className="text-2xl font-black mb-4">API Key Required</h2>
              <p className="text-gray-500 mb-8 text-sm font-medium">Для работы вне AI Studio нужен ключ Gemini API.</p>
              <input 
                type="password"
                placeholder="Enter AI Key..."
                className="w-full bg-gray-100 border-none rounded-2xl px-5 py-4 font-mono mb-4 text-center"
                onBlur={(e) => setApiKey(e.target.value)}
              />
              <button onClick={() => window.location.reload()} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl">Connect App</button>
            </div>
          </div>
        )}

        {!user.isRegistered && !showKeyPrompt && (
          <div className="fixed inset-0 bg-white z-[100] flex items-center justify-center p-6">
            <div className="max-w-md w-full text-center">
              <div className="w-20 h-20 bg-black rounded-[2rem] mx-auto flex items-center justify-center text-white text-3xl font-black mb-8 shadow-2xl">B</div>
              <h2 className="text-3xl font-black mb-3">{lang === 'ru' ? 'Создать Магазин' : 'Do\'kon yaratish'}</h2>
              <div className="space-y-4 text-left mt-10">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-4">{lang === 'ru' ? 'Имя мерчанта' : 'Merchant ismi'}</label>
                  <input placeholder="e.g. Aziz Designer" value={user.fullName} className="w-full bg-gray-50 border-2 border-gray-50 focus:border-blue-500 rounded-2xl px-6 py-5 font-bold outline-none" onChange={(e) => setUser({...user, fullName: e.target.value})} />
                </div>
                <button onClick={() => setUser({...user, isRegistered: true})} className="w-full bg-black text-white py-6 rounded-[2rem] font-black uppercase tracking-widest shadow-2xl mt-6">
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
      </main>
    </div>
  );
};

export default App;
