
import React, { useState } from 'react';
import { Product, Category, Shop, Language } from '../types';
import { translations } from '../translations';
import { sendToTelegram, escapeHtml } from '../services/telegramService';

interface InventoryViewProps {
  products: Product[];
  onUpdate: (product: Product) => void;
  onDelete: (id: string) => void;
  shop: Shop;
  lang: Language;
}

const InventoryView: React.FC<InventoryViewProps> = ({ products, onUpdate, onDelete, shop, lang }) => {
  const t = translations[lang].catalog;
  const [publishingProduct, setPublishingProduct] = useState<Product | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<'success' | 'error' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activePlatforms, setActivePlatforms] = useState<string[]>(['bot']);
  const [copyFeedback, setCopyFeedback] = useState(false);

  const hasBot = !!shop.telegramToken;

  const handlePublish = async () => {
    if (!publishingProduct) return;
    setSyncResult(null);
    setErrorMessage(null);
    
    const needsManualTelegram = (activePlatforms.includes('channel') || activePlatforms.includes('bot')) && !hasBot;

    if (needsManualTelegram) {
      const shareText = encodeURIComponent(`${publishingProduct.title}\n\n${publishingProduct.description}\n\nPrice: ${publishingProduct.price} ${publishingProduct.currency}`);
      const shareUrl = publishingProduct.imageUrl;
      const tMeUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${shareText}`;
      window.open(tMeUrl, '_blank');
      
      const updated = {
        ...publishingProduct,
        publishedTo: { 
          ...publishingProduct.publishedTo, 
          telegramBot: activePlatforms.includes('bot'),
          telegramChannel: activePlatforms.includes('channel'),
          instagram: activePlatforms.includes('instagram') && publishingProduct.publishedTo?.instagram
        }
      };
      onUpdate(updated);
      setPublishingProduct(null);
      return;
    }

    setIsSyncing(true);

    let allSuccess = true;
    
    // Escaping content to prevent HTML parse errors in Telegram
    const escapedTitle = escapeHtml(publishingProduct.title);
    const escapedDesc = escapeHtml(publishingProduct.description);
    const caption = `<b>${escapedTitle}</b>\n\n${escapedDesc}\n\n💰 <b>${publishingProduct.price.toLocaleString()} ${publishingProduct.currency}</b>`;

    if (activePlatforms.includes('channel') && shop.telegramToken && shop.telegramChannelId) {
      const result = await sendToTelegram(
        shop.telegramToken,
        shop.telegramChannelId,
        publishingProduct.videoUrl || publishingProduct.imageUrl,
        caption,
        !!publishingProduct.videoUrl
      );
      
      if (!result.success) {
        allSuccess = false;
        setErrorMessage(result.error || 'Unknown Telegram Error');
      }
    }

    if (allSuccess) {
      const updated = {
        ...publishingProduct,
        publishedTo: { 
          ...publishingProduct.publishedTo, 
          telegramBot: activePlatforms.includes('bot') || publishingProduct.publishedTo?.telegramBot,
          telegramChannel: activePlatforms.includes('channel') || publishingProduct.publishedTo?.telegramChannel,
          instagram: activePlatforms.includes('instagram') || publishingProduct.publishedTo?.instagram
        }
      };
      onUpdate(updated);
      setSyncResult('success');
      setTimeout(() => setPublishingProduct(null), 1500);
    } else {
      setSyncResult('error');
    }
    
    setIsSyncing(false);
  };

  const togglePlatform = (id: string) => {
    setActivePlatforms(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const copyToClipboard = () => {
    if (!publishingProduct) return;
    const text = `${publishingProduct.title}\n\n${publishingProduct.description}\n\nPrice: ${publishingProduct.price} ${publishingProduct.currency}`;
    navigator.clipboard.writeText(text);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900">{t.title}</h2>
          <p className="text-gray-500 font-medium">{t.subtitle}</p>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="bg-white rounded-[3rem] border-4 border-dashed border-gray-100 p-24 text-center">
          <div className="text-7xl mb-6">🏬</div>
          <h3 className="text-2xl font-black text-gray-900 mb-2">{t.empty}</h3>
          <p className="text-gray-400 font-medium">{t.emptyDesc}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden group hover:shadow-2xl transition-all duration-500">
              <div className="aspect-[4/5] relative overflow-hidden bg-gray-50 flex items-center justify-center">
                {product.videoUrl ? (
                  <video src={product.videoUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                ) : (
                  <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover" />
                )}
                
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                   <span className="bg-white/90 backdrop-blur-sm text-gray-900 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                    {product.category}
                  </span>
                  {product.publishedTo?.telegramChannel && (
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1">
                      <span>✓</span> Telegram
                    </span>
                  )}
                </div>

                <div className="absolute bottom-4 left-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                  <button 
                    onClick={() => setPublishingProduct(product)}
                    className="w-full bg-black text-white py-4 rounded-xl font-black text-xs shadow-xl active:scale-95"
                  >
                    {t.postToSocial}
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <h4 className="font-black text-gray-900 text-lg truncate mb-1">{product.title}</h4>
                <p className="text-gray-400 text-xs font-medium line-clamp-2 mb-4">{product.description}</p>
                <div className="flex items-center justify-between">
                  <p className="font-black text-2xl text-gray-900">{product.price.toLocaleString()} <span className="text-xs font-bold text-gray-400">UZS</span></p>
                  <button onClick={() => onDelete(product.id)} className="text-gray-300 hover:text-red-500 transition-colors">🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {publishingProduct && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-6 overflow-y-auto">
          <div className="bg-white rounded-[3rem] p-10 max-w-2xl w-full shadow-2xl animate-in">
            <div className="flex justify-between items-start mb-8">
              <h2 className="text-3xl font-black">{t.publishModal.title}</h2>
              <button onClick={() => setPublishingProduct(null)} className="text-gray-400 text-3xl">&times;</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col gap-4">
                <div className="aspect-[9/16] bg-black rounded-[2rem] overflow-hidden shadow-2xl relative">
                   {publishingProduct.videoUrl ? (
                    <video src={publishingProduct.videoUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                  ) : (
                    <img src={publishingProduct.imageUrl} className="w-full h-full object-cover" />
                  )}
                  {syncResult && (
                    <div className={`absolute inset-0 flex flex-col items-center justify-center p-6 text-center animate-in ${syncResult === 'success' ? 'bg-green-600/90' : 'bg-red-600/90'} text-white`}>
                      <span className="text-6xl mb-4">{syncResult === 'success' ? '🚀' : '❌'}</span>
                      <p className="font-black uppercase tracking-widest text-sm mb-2">
                        {syncResult === 'success' ? t.publishModal.success : t.publishModal.error}
                      </p>
                      {errorMessage && (
                        <p className="text-[10px] font-bold bg-white/20 p-2 rounded-lg max-w-xs">{errorMessage}</p>
                      )}
                    </div>
                  )}
                </div>
                <button 
                  onClick={copyToClipboard}
                  className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${copyFeedback ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {copyFeedback ? t.publishModal.copied : t.publishModal.copyBtn}
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">{t.publishModal.description}</label>
                  <textarea 
                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 font-medium text-sm min-h-[180px] outline-none leading-relaxed"
                    value={publishingProduct.description}
                    onChange={e => setPublishingProduct({...publishingProduct, description: e.target.value})}
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{t.publishModal.destinations}</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button 
                      onClick={() => togglePlatform('bot')}
                      className={`p-3 rounded-2xl flex flex-col items-center gap-2 border-2 transition-all ${activePlatforms.includes('bot') ? 'bg-blue-50 border-blue-400' : 'bg-gray-50 border-transparent opacity-50'}`}
                    >
                      <span className="text-xl">🤖</span>
                      <span className="text-[8px] font-black uppercase text-blue-600">Bot</span>
                    </button>
                    <button 
                      onClick={() => togglePlatform('channel')}
                      className={`p-3 rounded-2xl flex flex-col items-center gap-2 border-2 transition-all ${activePlatforms.includes('channel') ? 'bg-cyan-50 border-cyan-400' : 'bg-gray-50 border-transparent opacity-50'}`}
                    >
                      <span className="text-xl">📢</span>
                      <span className="text-[8px] font-black uppercase text-cyan-600">Channel</span>
                    </button>
                    <button 
                      onClick={() => togglePlatform('instagram')}
                      className={`p-3 rounded-2xl flex flex-col items-center gap-2 border-2 transition-all ${activePlatforms.includes('instagram') ? 'bg-pink-50 border-pink-400' : 'bg-gray-50 border-transparent opacity-50'}`}
                    >
                      <span className="text-xl">📸</span>
                      <span className="text-[8px] font-black uppercase text-pink-600">Insta</span>
                    </button>
                  </div>
                  
                  {!hasBot && (activePlatforms.includes('bot') || activePlatforms.includes('channel')) && (
                    <p className="text-[9px] font-bold text-orange-500 uppercase tracking-tight bg-orange-50 p-2 rounded-lg leading-tight">
                      ⚠️ {t.publishModal.manualWarning}
                    </p>
                  )}
                </div>

                <button 
                  onClick={handlePublish}
                  disabled={isSyncing || activePlatforms.length === 0}
                  className={`w-full ${syncResult === 'error' ? 'bg-red-600' : 'bg-blue-600'} text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50`}
                >
                  {isSyncing ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      {(!hasBot && (activePlatforms.includes('bot') || activePlatforms.includes('channel'))) ? t.publishModal.openTelegram : t.publishModal.blast}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryView;
