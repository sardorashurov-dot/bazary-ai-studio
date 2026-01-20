import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Language } from "../types";

const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === '' || apiKey === 'undefined') {
    console.error("CRITICAL: API_KEY is missing in environment variables!");
    throw new Error("API_KEY_NOT_SET");
  }
  return new GoogleGenAI({ apiKey });
};

function decodeBase64ToUint8(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export const analyzeProductImages = async (base64Images: string[], lang: Language = 'ru') => {
  if (!base64Images.length) return [];
  
  let ai;
  try {
    ai = getAI();
  } catch (e) {
    throw new Error("Ключ ИИ не настроен. Пожалуйста, добавьте API_KEY в переменные окружения Vercel (Settings -> Environment Variables) и сделайте Redeploy.");
  }

  const model = 'gemini-3-flash-preview';
  const langText = lang === 'ru' ? 'Russian' : 'Uzbek';

  const prompt = `Analyze these product images for a "Blue Ocean" strategy. Return a JSON array. 
  Each object: title, category, price (number), description (in ${langText}), blueOceanAdvice, scarcityScore (1-100), voiceScript. 
  Output only strict JSON.`;

  const imageParts = base64Images.map(base64 => ({
    inlineData: {
      mimeType: "image/jpeg",
      data: base64.includes(',') ? base64.split(',')[1] : base64
    }
  }));

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts: [...imageParts, { text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              category: { type: Type.STRING },
              price: { type: Type.NUMBER },
              description: { type: Type.STRING },
              blueOceanAdvice: { type: Type.STRING },
              scarcityScore: { type: Type.NUMBER },
              voiceScript: { type: Type.STRING }
            },
            required: ["title", "category", "price", "description", "blueOceanAdvice", "scarcityScore", "voiceScript"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    return JSON.parse(text);
  } catch (e: any) {
    console.error("Gemini Error:", e);
    if (e.message?.includes("403")) throw new Error("Ошибка 403: API ключ не имеет доступа к этой модели или заблокирован.");
    throw new Error(`Ошибка анализа: ${e.message || "Неизвестная ошибка ИИ"}`);
  }
};

export const generateProductVideo = async (
  base64Image: string, 
  prompt: string,
  onProgress?: (status: string) => void
): Promise<string | null> => {
  try {
    const ai = getAI();
    onProgress?.("Подготовка видео...");
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: `Cinematic product showcase: ${prompt}`,
      image: {
        imageBytes: base64Image.split(',')[1],
        mimeType: 'image/jpeg'
      },
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '9:16'
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 8000));
      onProgress?.("Рендеринг ИИ...");
      operation = await ai.operations.getVideosOperation({ operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) return null;

    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (e) {
    console.error("Video Gen Error:", e);
    return null;
  }
};

export const generateVoicePitch = async (text: string): Promise<string | null> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say this: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Puck' }
          }
        }
      }
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) return null;
    return URL.createObjectURL(new Blob([decodeBase64ToUint8(base64Audio)], { type: 'audio/pcm' }));
  } catch (e) {
    return null;
  }
};

export const enhanceImage = async (base64Image: string, title: string): Promise<string | null> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: base64Image.split(',')[1], mimeType: 'image/jpeg' } },
          { text: `Enhance professional photography for: ${title}` }
        ]
      }
    });
    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    return part ? `data:image/png;base64,${part.inlineData.data}` : null;
  } catch (e) {
    return null;
  }
};

export const performMarketResearch = async (query: string, lang: Language = 'ru') => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [{ parts: [{ text: query }] }],
      config: { tools: [{ googleSearch: {} }] },
    });
    const text = response.text || "";
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.filter((chunk: any) => chunk.web)
      ?.map((chunk: any) => ({ uri: chunk.web.uri, title: chunk.web.title || "Source" })) || [];
    return { text, sources };
  } catch (e) {
    return { text: "Ошибка поиска", sources: [] };
  }
};