import React, { useState, useRef } from 'react';
import { Product, ProductStatus, Category, TargetAudience, Language } from '../types';
import { analyzeProductImages, enhanceImage } from '../services/geminiService';
import { translations } from '../translations';

interface OnboardingViewProps {
  onComplete: (products: Product[]) => void;
  lang: Language;
}

const OnboardingView: React.FC<OnboardingViewProps> = ({ onComplete, lang }) => {
  const t = translations[lang].aiStudio;
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");
  const [enhancingId, setEnhancingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 1024;
          let w = img.width, h = img.height;
          if (w > h) { if (w > MAX_SIZE) { h *= MAX_SIZE / w; w = MAX_SIZE; } }
          else { if (h > MAX_SIZE) { w *= MAX_SIZE / h; h = MAX_SIZE; } }
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d')?.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const processImages = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setStep(2);
    setProcessingStatus(lang === 'ru' ? "Сканирование рыночных горизонтов..." : "Bozor ufqlarini skanerlash...");
    
    try {
      const base64Images = await Promise.all(files.map(f => compressImage(f)));
      const results = await analyzeProductImages(base64Images, lang);
      
      const mapped = results.map((res: any, idx: number) => ({
        ...res,
        id: Math.random().toString(36).substring(7),
        imageUrl: base64Images[idx],
        status: ProductStatus.DRAFT,
        createdAt: Date.now(),
        selectedRatio: '1:1'
      }));
      
      setDrafts(mapped);
      setStep(3);
    } catch (e) {
      alert("AI Analysis Error. Please try again.");
      setStep(1);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEnhance = async (idx: number) => {
    const d = drafts[idx];
    setEnhancingId(d.id);
    const url = await enhanceImage(d.imageUrl, d.category, d.title, d.targetAudience, d.selectedRatio);
    if (url) {
      const n = [...drafts]; n[idx].imageUrl = url; setDrafts(n);
    }
    setEnhancingId(null);
  };

  const finalize = () => {
    onComplete(drafts.map(d => ({ ...d, status: ProductStatus.PUBLISHED, currency: "UZS", variants: [] })));
  };

  return (
    <div className="max-w-4xl mx-auto glass-card min-h-[85vh] flex flex-col shadow-2xl rounded-[3rem] overflow-hidden border border-white/40">
      <div className="p-8 blue-ocean-gradient text-white flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Blue Ocean AI</h2>
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Creating Unique Market Spaces</p>
        </div>
        <div className="flex gap-2">
          {[1, 2, 3].map(s => (
            <div key={s} className={`h-1.5 w-8 rounded-full transition-all duration-700 ${step >= s ? 'bg-cyan-400' : 'bg-white/20'}`} />
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-10">
        {step === 1 && (
          <div className="py-12 text-center animate-in">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-5xl mx-auto mb-8 animate-float shadow-inner">💎</div>
            <h3 className="text-3xl font-black mb-4">Уйти от конкуренции</h3>
            <p className="text-slate-500 mb-12 max-w-sm mx-auto font-medium">Загрузите фото. ИИ найдет "Голубой океан" для вашего товара — уникальный угол продаж.</p>
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="aspect-video max-w-md mx-auto bg-slate-100/50 rounded-[2.5rem] border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all group overflow-hidden relative"
            >
              <div className="relative z-10 text-center">
                <span className="text-4xl mb-4 block">📸</span>
                <p className="font-black text-slate-400 uppercase tracking-widest text-[11px]">{t.choosePhotos}</p>
              </div>
              <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={e => setFiles(Array.from(e.target.files || []))} />
            </div>

            {files.length > 0 && (
              <button onClick={processImages} className="mt-12 blue-ocean-gradient text-white py-5 px-16 rounded-2xl font-black shadow-2xl hover:scale-105 active:scale-95 transition-all uppercase tracking-widest text-xs">
                Запустить Стратегию ({files.length})
              </button>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="py-32 text-center animate-in">
            <div className="relative w-24 h-24 mx-auto mb-10">
               <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
               <div className="absolute inset-0 border-4 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
            <p className="text-blue-900 font-black uppercase tracking-widest text-xs animate-pulse">{processingStatus}</p>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-12 animate-in pb-10">
            <div className="flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-md z-30 py-4 -mx-8 px-8 border-b border-slate-100">
              <h3 className="text-xl font-black text-blue-950 tracking-tight">Ваш Уникальный Оффер</h3>
              <button onClick={finalize} className="blue-ocean-gradient text-white px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:opacity-90 transition-all">Внедрить в Магазин</button>
            </div>

            {drafts.map((d, i) => (
              <div key={d.id} className="bg-white rounded-[3rem] p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row gap-10 hover:shadow-xl transition-shadow">
                <div className="w-full md:w-72 flex-none aspect-square bg-slate-50 rounded-[2.5rem] overflow-hidden relative shadow-lg group">
                  <img src={d.imageUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" />
                  {enhancingId === d.id && (
                    <div className="absolute inset-0 bg-blue-900/40 backdrop-blur-sm flex items-center justify-center text-white text-[10px] font-black uppercase tracking-widest">Обработка...</div>
                  )}
                  <button onClick={() => handleEnhance(i)} className="absolute bottom-4 right-4 bg-white/90 p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">✨</button>
                </div>

                <div className="flex-1 flex flex-col">
                   <div className="bg-cyan-50 border border-cyan-100 p-5 rounded-2xl mb-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 text-[40px] opacity-10 font-black select-none">BLUE</div>
                    <label className="text-[9px] font-black text-cyan-700 uppercase tracking-widest block mb-2">💎 Стратегическое преимущество</label>
                    <p className="text-sm font-bold text-blue-900 leading-relaxed">"{d.blueOceanAdvice}"</p>
                  </div>

                  <div className="space-y-4 flex-1">
                    <input 
                      className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-black text-xl text-slate-900 outline-none focus:ring-2 ring-blue-100"
                      value={d.title}
                      onChange={e => { const n = [...drafts]; n[i].title = e.target.value; setDrafts(n); }}
                    />
                    <textarea 
                      className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-medium text-slate-500 min-h-[120px] outline-none leading-relaxed"
                      value={d.description}
                      onChange={e => { const n = [...drafts]; n[i].description = e.target.value; setDrafts(n); }}
                    />
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                    <div className="text-2xl font-black text-blue-900">{d.price.toLocaleString()} <span className="text-[10px] text-slate-400">UZS</span></div>
                    <div className="flex gap-2">
                       <span className="bg-slate-100 text-slate-500 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest">{d.category}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingView;