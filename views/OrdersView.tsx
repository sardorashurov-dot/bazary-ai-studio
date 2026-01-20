
import React from 'react';
import { Order, Language } from '../types';
import { translations } from '../translations';

interface OrdersViewProps {
  orders: Order[];
  lang: Language;
}

const OrdersView: React.FC<OrdersViewProps> = ({ orders, lang }) => {
  const t = translations[lang].orders;
  return (
    <div className="max-w-6xl mx-auto animate-in">
      <div className="mb-12 flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-gray-900 tracking-tight">{t.title}</h2>
          <p className="text-gray-400 font-bold mt-2 uppercase tracking-[0.2em] text-[10px]">{t.subtitle}</p>
        </div>
        <div className="bg-blue-50 px-6 py-3 rounded-2xl flex items-center gap-3 border border-blue-100">
          <span className="text-xl">💰</span>
          <span className="text-xs font-black text-blue-700 uppercase tracking-widest">{t.revenue}: {orders.reduce((acc, curr) => acc + curr.total, 0).toLocaleString()} UZS</span>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-gray-100 shadow-2xl overflow-hidden">
        {orders.length === 0 ? (
          <div className="p-32 text-center">
            <div className="text-8xl mb-8 grayscale">🛍️</div>
            <h3 className="text-3xl font-black text-gray-900 mb-4">{t.empty}</h3>
            <p className="text-gray-400 max-w-sm mx-auto font-medium leading-relaxed">
              {t.emptyDesc}
            </p>
            <button className="mt-8 bg-black text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">{t.copyLink}</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.table.details}</th>
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.table.customer}</th>
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.table.total}</th>
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.table.status}</th>
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.table.date}</th>
                  <th className="px-8 py-6"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-8 py-6">
                      <p className="text-sm font-black text-blue-600 mb-1">#{order.id.slice(0, 8).toUpperCase()}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">{order.items.length} items</p>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-sm font-black text-gray-900">{order.customerName}</p>
                      <p className="text-xs text-blue-500 font-bold">{order.customerPhone}</p>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-lg font-black text-gray-900">{order.total.toLocaleString()}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">UZS</p>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm ${
                        order.status === 'new' ? 'bg-orange-100 text-orange-600' :
                        order.status === 'confirmed' ? 'bg-blue-100 text-blue-600' :
                        'bg-green-100 text-green-600'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-xs font-bold text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button className="bg-white border border-gray-100 text-gray-900 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all shadow-sm">
                        {t.table.process}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersView;
