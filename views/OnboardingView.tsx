import React, { useState, useRef } from 'react';
import { Product, ProductStatus, Language } from '../types';
import { analyzeProductImages, enhanceImage, generateProductVideo, generateVoicePitch } from '../services/geminiService';
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
  const [drafts, setDrafts] = useState<any[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Ошибка чтения файла"));
      reader.onload = (e) => {
        const img = new Image();
        img.onerror = () => reject(new Error("Ошибка загрузки изображения"));
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
    setProcessingStatus(lang === 'ru' ? "Анализ рыночных аномалий..." : "Bozor anomaliyalari tahlili...");
    
    try {
      const base64Images = await Promise.all(files.map(f => compressImage(f)));
      const results = await analyzeProductImages(base64Images, lang);
      
      if (!results || !Array.isArray(results)) {
        throw new Error("ИИ вернул некорректный ответ. Попробуйте загрузить фото еще раз.");
      }

      const mapped = results.map((res: any, idx: number) => ({
        ...res,
        id: Math.random().toString(36).substring(7),
        imageUrl: base64Images[idx] || base64Images[0],
        videoUrl: null,
        audioUrl: null,
        status: ProductStatus.DRAFT,
        createdAt: Date.now()
      }));
      
      setDrafts(mapped);
      setStep(3);
    } catch (e: any) {
      console.error("Upload Error:", e);
      // Выводим конкретную ошибку пользователю
      alert(`Ошибка ИИ: ${e.message || "Неизвестный сбой"}. Проверьте серверную переменную API_KEY (или GEMINI_API_KEY) в Vercel и доступ к модели Gemini.`);
      setStep(1);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length > 0) {
      setFiles(selected);
    }
  };

  const handleVeoGenerate = async (idx: number) => {
    const d = drafts[idx];
    setBusyId(d.id + '_video');
    const url = await generateProductVideo(d.imageUrl, d.title, (s) => setProcessingStatus(s));
    if (url) {
      const n = [...drafts];
      n[idx].videoUrl = url;
      setDrafts(n);
    }
    setBusyId(null);
  };

  const handleTTSGenerate = async (idx: number) => {
    const d = drafts[idx];
    setBusyId(d.id + '_audio');
    const url = await generateVoicePitch(d.voiceScript || d.title);
    if (url) {
      const n = [...drafts];
      n[idx].audioUrl = url;
      setDrafts(n);
    }
    setBusyId(null);
  };

  const handleEnhance = async (idx: number) => {
    const d = drafts[idx];
    setBusyId(d.id + '_img');
    const url = await enhanceImage(d.imageUrl, d.title);
    if (url) {
      const n = [...drafts];
      n[idx].imageUrl = url;
      setDrafts(n);
    }
    setBusyId(null);
  };

  const finalize = () => {
    onComplete(drafts.map(d => ({ 
      ...d, 
      status: ProductStatus.PUBLISHED, 
      currency: "UZS", 
      variants: [] 
    })));
  };

  return (
    <div className="max-w-5xl mx-auto glass-card min-h-[90vh] flex flex-col shadow-2xl rounded-[3rem] overflow-hidden border border-white/40">
      <div className="p-8 blue-ocean-gradient text-white flex justify-between items-center relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-black tracking-tight">Blue Ocean AI Studio</h2>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-70">Automated Content Agency</p>
        </div>
        <div className="flex gap-2 relative z-10">
          {[1, 2, 3].map(s => (
            <div key={s} className={`h-1.5 w-10 rounded-full transition-all duration-700 ${step >= s ? 'bg-cyan-400' : 'bg-white/20'}`} />
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-10">
        {step === 1 && (
          <div className="py-20 text-center animate-in">
            <div className="w-28 h-28 bg-blue-100 rounded-full flex items-center justify-center text-5xl mx-auto mb-10 shadow-inner">💎</div>
            <h3 className="text-4xl font-black mb-4">Создать Магазин Будущего</h3>
            <p className="text-slate-500 mb-12 max-w-sm mx-auto font-medium">Просто загрузите фото ваших товаров. ИИ создаст уникальную стратегию продаж.</p>
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="aspect-video max-w-lg mx-auto bg-slate-50 rounded-[3rem] border-4 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all group overflow-hidden relative"
            >
              <div className="relative z-10 text-center">
                <span className="text-5xl mb-4 block group-hover:scale-125 transition-transform">📸</span>
                <p className="font-black text-slate-400 uppercase tracking-widest text-[11px]">{files.length > 0 ? `${t.selected}: ${files.length}` : t.choosePhotos}</p>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                multiple 
                accept="image/*" 
                onChange={handleFileChange} 
              />
            </div>

            {files.length > 0 && (
              <button 
                onClick={processImages} 
                className="mt-12 blue-ocean-gradient text-white py-6 px-20 rounded-2xl font-black shadow-2xl hover:scale-105 active:scale-95 transition-all uppercase tracking-widest text-xs"
              >
                {lang === 'ru' ? `Начать Анализ (${files.length})` : `Tahlilni boshlash (${files.length})`}
              </button>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="py-40 text-center animate-in">
            <div className="w-20 h-20 border-8 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto mb-12"></div>
            <p className="text-blue-900 font-black uppercase tracking-widest text-sm animate-pulse">{processingStatus}</p>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-16 pb-20">
            <div className="flex justify-between items-center sticky top-0 bg-white/90 backdrop-blur-md z-40 py-6 -mx-6 px-6 border-b border-slate-100">
              <div>
                <h3 className="text-2xl font-black text-blue-950 tracking-tight">Ваш Маркетинговый План</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Готов к публикации в 1 клик</p>
              </div>
              <button onClick={finalize} className="blue-ocean-gradient text-white px-12 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl hover:opacity-90 active:scale-95 transition-all">Принять всё</button>
            </div>

            {drafts.map((d, i) => (
              <div key={d.id} className="bg-white rounded-[4rem] p-10 shadow-sm border border-slate-100 flex flex-col lg:flex-row gap-12 group hover:shadow-2xl transition-all duration-500">
                <div className="w-full lg:w-80 flex-none flex flex-col gap-4">
                  <div className="aspect-square bg-slate-50 rounded-[3rem] overflow-hidden relative shadow-inner">
                    {busyId === d.id + '_video' ? (
                       <div className="absolute inset-0 bg-blue-900/40 backdrop-blur-md flex flex-center items-center justify-center p-6 text-center">
                          <p className="text-white font-black text-[10px] uppercase leading-relaxed">{processingStatus}</p>
                       </div>
                    ) : d.videoUrl ? (
                      <video src={d.videoUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                    ) : (
                      <img src={d.imageUrl} className="w-full h-full object-cover" />
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => handleEnhance(i)}
                      disabled={busyId !== null}
                      className="bg-slate-100 hover:bg-blue-600 hover:text-white py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                    >
                      {busyId === d.id + '_img' ? "..." : "✨ HQ Фото"}
                    </button>
                    <button 
                      onClick={() => handleVeoGenerate(i)}
                      disabled={busyId !== null || d.videoUrl}
                      className={`py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${d.videoUrl ? 'bg-green-100 text-green-600' : 'bg-blue-600 text-white shadow-lg hover:bg-blue-700 disabled:opacity-50'}`}
                    >
                      {d.videoUrl ? "✓ Видео" : "🎬 Reels"}
                    </button>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-3xl mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[9px] font-black text-slate-400 uppercase">Рыночный потенциал</span>
                      <span className="text-xs font-black text-blue-600">{d.scarcityScore}%</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 transition-all duration-1000" style={{width: `${d.scarcityScore}%`}}></div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 flex flex-col">
                  <div className="bg-cyan-50 border border-cyan-100 p-8 rounded-[3rem] mb-8 relative overflow-hidden">
                    <div className="absolute -top-4 -right-4 text-[100px] opacity-5 font-black">BLUE</div>
                    <label className="text-[10px] font-black text-cyan-700 uppercase tracking-widest block mb-3">💎 Стратегия Голубого Океана</label>
                    <p className="text-lg font-bold text-blue-900 leading-relaxed italic">"{d.blueOceanAdvice}"</p>
                  </div>

                  <div className="space-y-6">
                    <input 
                      className="w-full bg-transparent border-b-2 border-slate-100 focus:border-blue-500 px-2 py-4 font-black text-3xl text-slate-900 outline-none transition-all"
                      value={d.title}
                      onChange={e => { const n = [...drafts]; n[i].title = e.target.value; setDrafts(n); }}
                    />
                    <textarea 
                      className="w-full bg-slate-50 border-none rounded-3xl px-8 py-6 text-sm font-medium text-slate-500 min-h-[160px] outline-none leading-relaxed"
                      value={d.description}
                      onChange={e => { const n = [...drafts]; n[i].description = e.target.value; setDrafts(n); }}
                    />
                  </div>

                  <div className="mt-10 pt-8 border-t border-slate-50 flex flex-wrap items-center justify-between gap-6">
                    <div className="text-4xl font-black text-blue-950">{d.price.toLocaleString()} <span className="text-xs text-slate-400">UZS</span></div>
                    
                    <div className="flex items-center gap-4">
                       {d.audioUrl ? (
                         <div className="bg-green-50 px-6 py-3 rounded-2xl flex items-center gap-3">
                            <span className="animate-pulse">🔊</span>
                            <span className="text-[10px] font-black text-green-700 uppercase">Питч готов</span>
                         </div>
                       ) : (
                         <button 
                          onClick={() => handleTTSGenerate(i)}
                          className="bg-black text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95"
                         >
                           🎙️ ИИ Голос
                         </button>
                       )}
                       <span className="bg-slate-100 text-slate-500 px-6 py-3 rounded-2xl text-[10px] font-black uppercase">{d.category}</span>
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