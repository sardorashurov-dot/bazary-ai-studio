
import React, { useState } from 'react';
import { performMarketResearch } from '../services/geminiService';
import { Language } from '../types';

interface ResearchViewProps {
  lang: Language;
}

const ResearchView: React.FC<ResearchViewProps> = ({ lang }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<{text: string, sources: any[]} | null>(null);

  const handleResearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const result = await performMarketResearch(query, lang);
      setReport(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const t = {
    title: lang === 'ru' ? 'Рыночная Аналитика' : 'Bozor Analitikasi',
    placeholder: lang === 'ru' ? 'Например: Тренды мужских кроссовок в Узбекистане 2025' : 'Masalan: O\'zbekistonda 2025-yilda erkaklar krossovkalari trendlari',
    btn: lang === 'ru' ? 'Исследовать Рынок' : 'Bozorni Tadqiq Qilish',
    sources: lang === 'ru' ? 'Источники:' : 'Manbalar:',
  };

  return (
    <div className="max-w-4xl mx-auto animate-in">
      <div className="mb-12">
        <h2 className="text-4xl font-black text-gray-900 tracking-tight">{t.title}</h2>
        <p className="text-gray-400 font-bold mt-2 uppercase tracking-[0.2em] text-[10px]">Strategy Core Deep Intelligence</p>
      </div>

      <div className="bg-white rounded-[3rem] p-8 shadow-2xl border border-gray-100 mb-12">
        <div className="flex flex-col md:flex-row gap-4">
          <input 
            className="flex-1 bg-gray-50 border-none rounded-2xl px-6 py-5 font-bold text-gray-900 outline-none focus:ring-4 ring-blue-50 transition-all"
            placeholder={t.placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button 
            onClick={handleResearch}
            disabled={loading}
            className="bg-blue-600 text-white px-8 py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-95 hover:bg-blue-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <span>🔍 {t.btn}</span>}
          </button>
        </div>
      </div>

      {report && (
        <div className="bg-white rounded-[3rem] p-10 shadow-2xl border border-gray-100 animate-in">
          <div className="prose prose-blue max-w-none text-gray-700 font-medium leading-relaxed mb-10">
            {report.text.split('\n').map((line, i) => (
              <p key={i} className="mb-2">{line}</p>
            ))}
          </div>

          {report.sources.length > 0 && (
            <div className="pt-8 border-t border-gray-50">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">{t.sources}</h4>
              <div className="flex flex-wrap gap-2">
                {report.sources.map((source, i) => (
                  <a 
                    key={i} 
                    href={source.uri} 
                    target="_blank" 
                    rel="noreferrer"
                    className="bg-gray-50 hover:bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-[10px] font-black border border-gray-100 transition-all flex items-center gap-2"
                  >
                    🌐 {source.title.slice(0, 30)}...
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!report && !loading && (
        <div className="text-center py-20 bg-blue-50/30 rounded-[3rem] border-2 border-dashed border-blue-100">
          <div className="text-6xl mb-6">🛰️</div>
          <h3 className="text-xl font-black text-blue-900 mb-2">{lang === 'ru' ? 'Поиск вне конкуренции' : 'Raqobatdan tashqari qidiruv'}</h3>
          <p className="text-blue-500 text-xs font-bold max-w-sm mx-auto">{lang === 'ru' ? 'Найдите идеи, которые еще не заняты на рынке, используя мощь Google Search + Gemini.' : 'Google qidiruvi va Gemini qudratidan foydalanib, bozorda hali egallanmagan g\'oyalarni toping.'}</p>
        </div>
      )}
    </div>
  );
};

export default ResearchView;
