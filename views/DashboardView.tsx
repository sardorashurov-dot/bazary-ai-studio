import React from 'react';
import { Product, Order, Language } from '../types';
import { translations } from '../translations';

interface DashboardViewProps {
  products: Product[];
  orders: Order[];
  onStartOnboarding: () => void;
  lang: Language;
}

const DashboardView: React.FC<DashboardViewProps> = ({ products, orders, onStartOnboarding, lang }) => {
  const t = translations[lang].dashboard;
  const totalRevenue = orders.reduce((acc, curr) => acc + curr.total, 0);
  
  const stats = [
    { label: t.stats.catalog, value: products.length, icon: '🛍️', color: 'bg-blue-600' },
    { label: t.stats.orders, value: orders.length, icon: '📈', color: 'bg-indigo-600' },
    { label: t.stats.aiMedia, value: products.filter(p => p.videoUrl).length, icon: '🎬', color: 'bg-cyan-600' },
    { label: t.stats.revenue, value: `${totalRevenue.toLocaleString()} UZS`, icon: '💎', color: 'bg-blue-900' },
  ];

  return (
    <div className="max-w-6xl mx-auto animate-in space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-5xl font-black text-gray-900 tracking-tighter mb-2">
            {lang === 'ru' ? 'Студия Голубого Океана' : 'Moviy Okean Studiyasi'}
          </h2>
          <p className="text-blue-600 font-black uppercase tracking-[0.3em] text-[10px]">AI Strategic Merchant Intelligence</p>
        </div>
        <button
          onClick={onStartOnboarding}
          className="bg-blue-600 text-white px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-[0_20px_40px_rgba(37,99,235,0.3)] hover:scale-105 hover:bg-blue-700 transition-all active:scale-95"
        >
          <span>✨</span> {t.importBtn}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm hover:shadow-2xl transition-all group overflow-hidden relative">
            <div className={`absolute top-0 right-0 w-24 h-24 ${stat.color} opacity-5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-150`}></div>
            <div className={`w-14 h-14 ${stat.color} text-white rounded-[1.5rem] flex items-center justify-center text-2xl mb-6 shadow-xl`}>
              {stat.icon}
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-2xl font-black text-gray-900 tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-gradient-to-br from-gray-900 to-blue-900 rounded-[4rem] p-12 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 p-12 opacity-10 text-[15rem] font-black leading-none pointer-events-none">AI</div>
          <h3 className="text-3xl font-black mb-10 tracking-tight">
            {lang === 'ru' ? 'Ваш путь к доминированию' : 'Hukmronlik sari yo\'lingiz'}
          </h3>
          <div className="grid md:grid-cols-2 gap-8 relative z-10">
            {t.steps.map((item, i) => (
              <div key={i} className="flex gap-4 p-6 rounded-[2rem] bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
                <div className="text-2xl opacity-50">0{i+1}</div>
                <div>
                  <h4 className="font-black text-sm uppercase tracking-widest text-blue-400 mb-2">{item.t}</h4>
                  <p className="text-xs text-gray-300 font-medium leading-relaxed">{item.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-[4rem] p-12 flex flex-col items-center text-center border border-gray-100 shadow-xl">
          <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center text-5xl mb-8 animate-pulse shadow-inner">🛰️</div>
          <h3 className="text-xl font-black text-gray-900 mb-4">{t.automatedSales}</h3>
          <p className="text-gray-500 text-xs font-medium leading-relaxed mb-10">
            {t.automatedSalesDesc}
          </p>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-4">
            <div className="h-full bg-blue-600 w-[65%] shadow-[0_0_15px_rgba(37,99,235,0.5)]"></div>
          </div>
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Market Ready: 65%</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;