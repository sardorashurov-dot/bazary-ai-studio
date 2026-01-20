
import React, { useState, useRef } from 'react';
import { Product, ProductStatus, Category, TargetAudience, Language } from '../types';
import { analyzeProductImages, enhanceImage, generateProductVideo } from '../services/geminiService';
import { translations } from '../translations';

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  var aistudio: AIStudio;
}

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
  const [videoStatus, setVideoStatus] = useState<string>("");
  const [drafts, setDrafts] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onerror = () => reject(new Error("Failed to load image"));
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject(new Error("Canvas context failed"));
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files).slice(0, 10));
    }
  };

  const processImages = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setStep(2);
    setProcessingStatus(t.status.optimizing);
    
    try {
      const base64Images = [];
      for(let i=0; i<files.length; i++) {
        const compressed = await compressImage(files[i]);
        base64Images.push(compressed);
      }
      
      setProcessingStatus(t.status.analyzing);
      const results = await analyzeProductImages(base64Images, lang);
      
      const mappedDrafts = results.map((res: any, idx: number) => ({
        ...res,
        id: Math.random().toString(36).substring(7),
        imageUrl: base64Images[idx] || base64Images[0],
        status: ProductStatus.DRAFT,
        createdAt: Date.now(),
        isEnhanced: false,
        videoUrl: null,
        selectedRatio: '1:1' as "1:1" | "9:16"
      }));
      
      setDrafts(mappedDrafts);
      setStep(3);
    } catch (error) {
      console.error(error);
      alert("Error processing images.");
      setStep(1);
    } finally {
      setIsProcessing(false);
      setProcessingStatus("");
    }
  };

  const handleEnhance = async (idx: number) => {
    const draft = drafts[idx];
    setEnhancingId(draft.id + '_photo');
    try {
      const enhancedUrl = await enhanceImage(draft.imageUrl, draft.category, draft.title, draft.targetAudience, draft.selectedRatio);
      if (enhancedUrl) {
        const newDrafts = [...drafts];
        newDrafts[idx] = { ...newDrafts[idx], imageUrl: enhancedUrl, isEnhanced: true };
        setDrafts(newDrafts);
      }
    } catch (error) {
      console.error("Enhancement failed", error);
    } finally {
      setEnhancingId(null);
    }
  };

  const handleCreateVideo = async (idx: number) => {
    if (window.aistudio) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) await window.aistudio.openSelectKey();
    }

    const draft = drafts[idx];
    setEnhancingId(draft.id + '_video');
    try {
      // Veo supports 9:16 or 16:9. If user chose 1:1, we default to 9:16 for cinematic Reels
      const targetRatio = draft.selectedRatio === '1:1' ? '9:16' : draft.selectedRatio;
      const videoUrl = await generateProductVideo(draft.imageUrl, draft.title, targetRatio as any, setVideoStatus);
      if (videoUrl) {
        const newDrafts = [...drafts];
        newDrafts[idx] = { ...newDrafts[idx], videoUrl };
        setDrafts(newDrafts);
      }
    } catch (error) {
      console.error("Video failed", error);
    } finally {
      setEnhancingId(null);
      setVideoStatus("");
    }
  };

  const finalize = () => {
    const finalProducts: Product[] = drafts.map(d => ({
      ...d,
      status: ProductStatus.PUBLISHED,
      currency: "UZS",
      variants: []
    }));
    onComplete(finalProducts);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white min-h-[85vh] flex flex-col shadow-2xl rounded-[3.5rem] overflow-hidden border border-gray-100">
      <div className="px-10 pt-10 pb-6 flex justify-between items-center bg-gray-50/50">
        <div className="flex gap-2">
          {[1, 2, 3].map(s => (
            <div key={s} className={`h-1.5 w-16 rounded-full transition-all duration-500 ${step >= s ? 'bg-blue-600' : 'bg-gray-200'}`} />
          ))}
        </div>
        <div className="flex items-center gap-2">
           <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
           <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">AI Core Active</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-10 pb-10">
        {step === 1 && (
          <div className="flex flex-col h-full justify-center text-center py-12 animate-in">
            <h2 className="text-4xl font-black text-gray-900 leading-tight mb-4">{t.title}</h2>
            <p className="text-gray-500 mb-12 max-w-sm mx-auto font-medium">{t.subtitle}</p>
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="aspect-[4/5] max-w-sm mx-auto bg-blue-50/50 rounded-[3rem] border-4 border-dashed border-blue-100 flex flex-col items-center justify-center cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-all group relative overflow-hidden"
            >
              <div className="text-7xl mb-6 group-hover:scale-110 transition-transform">📸</div>
              <p className="font-black text-blue-600 uppercase tracking-widest text-xs">{t.choosePhotos}</p>
              <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={handleFileChange} />
              
              {files.length > 0 && (
                <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center p-8 animate-in">
                  <p className="text-2xl font-black text-gray-900 mb-2">{files.length} {t.selected}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.tapToChange}</p>
                </div>
              )}
            </div>

            {files.length > 0 && (
              <button 
                onClick={processImages} 
                className="mt-12 bg-black text-white py-6 px-12 rounded-[2rem] font-black shadow-2xl active:scale-95 transition-all mx-auto uppercase tracking-widest text-sm"
              >
                {t.analyzeBtn}
              </button>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col h-full items-center justify-center text-center py-20 animate-in">
            <div className="relative mb-12">
              <div className="w-32 h-32 border-[12px] border-blue-50 border-t-blue-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center text-4xl">✨</div>
            </div>
            <h3 className="text-3xl font-black text-gray-900">Processing...</h3>
            <p className="text-gray-400 font-bold mt-4 uppercase tracking-widest text-[10px]">{processingStatus}</p>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-12 py-6 animate-in">
            <div className="flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-md z-10 py-4 border-b border-gray-50">
              <h3 className="text-2xl font-black text-gray-900">{t.reviewTitle}</h3>
              <button onClick={finalize} className="bg-blue-600 text-white px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest shadow-xl active:scale-95">{t.finishBtn}</button>
            </div>

            {drafts.map((draft, idx) => (
              <div key={draft.id} className="bg-gray-50 rounded-[3.5rem] p-6 flex flex-col gap-8 border border-gray-100 shadow-sm">
                <div className={`mx-auto w-full max-w-sm transition-all duration-500 overflow-hidden relative shadow-2xl group rounded-[2.5rem] bg-black ${draft.selectedRatio === '1:1' ? 'aspect-square' : 'aspect-[9/16]'}`}>
                  {draft.videoUrl ? (
                    <video src={draft.videoUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                  ) : (
                    <img src={draft.imageUrl} className="w-full h-full object-cover" />
                  )}

                  {enhancingId?.startsWith(draft.id) && (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center text-white p-6 text-center z-20">
                      <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mb-6"></div>
                      <p className="text-[10px] font-black uppercase tracking-widest">
                        {enhancingId.includes('video') ? t.status.generatingVideo : t.status.enhancing}
                      </p>
                    </div>
                  )}
                </div>

                <div className="px-4 space-y-6">
                  {/* Aspect Ratio Selector */}
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-1">{t.form.format}</label>
                    <div className="grid grid-cols-2 gap-2 bg-white p-1 rounded-2xl shadow-sm">
                      <button 
                        onClick={() => { const n = [...drafts]; n[idx].selectedRatio = '1:1'; setDrafts(n); }}
                        className={`py-3 rounded-xl text-[10px] font-black uppercase transition-all ${draft.selectedRatio === '1:1' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400'}`}
                      >
                        {t.form.square}
                      </button>
                      <button 
                        onClick={() => { const n = [...drafts]; n[idx].selectedRatio = '9:16'; setDrafts(n); }}
                        className={`py-3 rounded-xl text-[10px] font-black uppercase transition-all ${draft.selectedRatio === '9:16' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400'}`}
                      >
                        {t.form.vertical}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-1">{t.form.title}</label>
                    <input 
                      className="block w-full font-black text-xl bg-white rounded-2xl border-none p-5 shadow-sm"
                      value={draft.title}
                      onChange={e => {
                        const n = [...drafts]; n[idx].title = e.target.value; setDrafts(n);
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-1">{t.form.category}</label>
                      <select 
                        className="w-full bg-white border-none rounded-2xl text-xs font-black px-5 py-4 shadow-sm"
                        value={draft.category}
                        onChange={e => {
                          const n = [...drafts]; n[idx].category = e.target.value as Category; setDrafts(n);
                        }}
                      >
                        {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-1">{t.form.audience}</label>
                      <select 
                        className="w-full bg-white border-none rounded-2xl text-xs font-black px-5 py-4 shadow-sm"
                        value={draft.targetAudience}
                        onChange={e => {
                          const n = [...drafts]; n[idx].targetAudience = e.target.value as TargetAudience; setDrafts(n);
                        }}
                      >
                        {Object.values(TargetAudience).map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-1">{t.form.marketingText}</label>
                    <textarea 
                      className="block w-full text-sm font-medium text-gray-600 bg-white rounded-2xl border-none p-5 shadow-sm min-h-[120px]"
                      value={draft.description}
                      onChange={e => {
                        const n = [...drafts]; n[idx].description = e.target.value; setDrafts(n);
                      }}
                    />
                  </div>
                  
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-1">{t.form.price}</label>
                    <input 
                      type="number"
                      className="w-full bg-white border-none rounded-2xl text-lg font-black px-5 py-4 shadow-sm text-blue-600"
                      value={draft.price}
                      onChange={e => {
                        const n = [...drafts]; n[idx].price = Number(e.target.value); setDrafts(n);
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <button 
                      onClick={() => handleEnhance(idx)}
                      disabled={!!enhancingId}
                      className="bg-black text-white py-5 rounded-3xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-xl"
                    >
                      {t.actions.photoStudio}
                    </button>
                    <button 
                      onClick={() => handleCreateVideo(idx)}
                      disabled={!!enhancingId}
                      className="bg-white border-2 border-black text-black py-5 rounded-3xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-xl"
                    >
                      {t.actions.videoCreator}
                    </button>
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
