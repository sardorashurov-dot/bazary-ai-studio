
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
    { label: t.stats.catalog, value: products.length, icon: '📦', color: 'bg-blue-600' },
    { label: t.stats.orders, value: orders.length, icon: '🛒', color: 'bg-purple-600' },
    { label: t.stats.aiMedia, value: products.filter(p => p.videoUrl).length, icon: '🎥', color: 'bg-pink-600' },
    { label: t.stats.revenue, value: `${totalRevenue.toLocaleString()} UZS`, icon: '💰', color: 'bg-green-600' },
  ];

  return (
    <div className="max-w-6xl mx-auto animate-in">
      <div className="flex justify-between items-end mb-12">
        <div>
          <h2 className="text-4xl font-black text-gray-900 tracking-tight">{t.title}</h2>
          <p className="text-gray-400 font-bold mt-2 uppercase tracking-[0.2em] text-[10px]">{t.subtitle}</p>
        </div>
        <button
          onClick={onStartOnboarding}
          className="bg-black text-white px-8 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-2xl hover:scale-105 transition-all active:scale-95"
        >
          <span>✨</span> {t.importBtn}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
            <div className={`w-12 h-12 ${stat.color} text-white rounded-2xl flex items-center justify-center text-xl mb-6 shadow-lg group-hover:rotate-12 transition-transform`}>
              {stat.icon}
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
            <p className="text-2xl font-black text-gray-900 mt-2 truncate">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-gray-900 rounded-[3rem] p-10 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-10 text-9xl">📈</div>
          <h3 className="text-2xl font-black mb-8">{t.readyToSell}</h3>
          <div className="space-y-6 relative z-10">
            {t.steps.map((item, i) => {
              const done = (i === 0 && products.length > 0) || (i === 1 && orders.length > 0);
              return (
                <div key={i} className="flex items-start gap-5 group">
                  <div className={`w-6 h-6 rounded-full flex-shrink-0 border-2 flex items-center justify-center transition-all ${done ? 'bg-green-500 border-green-500' : 'border-gray-700'}`}>
                    {done && <span className="text-[10px]">✓</span>}
                  </div>
                  <div>
                    <h4 className={`font-black text-sm uppercase tracking-widest ${done ? 'text-white' : 'text-gray-500'}`}>{item.t}</h4>
                    <p className="text-xs text-gray-400 mt-1 font-medium">{item.d}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-blue-50 rounded-[3rem] p-10 flex flex-col items-center text-center">
          <div className="text-5xl mb-6">🤖</div>
          <h3 className="text-xl font-black text-blue-900 mb-2">{t.automatedSales}</h3>
          <p className="text-blue-700 text-xs font-bold leading-relaxed mb-8">
            {t.automatedSalesDesc}
          </p>
          <div className="w-full h-1.5 bg-blue-200 rounded-full overflow-hidden">
            <div className={`h-full bg-blue-600 transition-all duration-1000`} style={{ width: products.length > 0 ? '45%' : '10%' }} />
          </div>
          <p className="text-[9px] font-black text-blue-400 mt-3 uppercase tracking-widest">{t.readiness}: {products.length > 0 ? '45%' : '10%'}</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
