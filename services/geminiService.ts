import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Category, TargetAudience, Language } from "../types";

const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY_MISSING");
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
  
  const ai = getAI();
  const model = 'gemini-3-flash-preview';
  const langText = lang === 'ru' ? 'Russian' : 'Uzbek';

  const prompt = `
    Analyze these images as an Expert Blue Ocean Strategist. 
    Return a JSON array where each object corresponds to an image and contains:
    1. title: Catchy name
    2. category: E-commerce category
    3. price: Estimated numeric price in UZS
    4. description: Compelling Telegram marketing text in ${langText}
    5. blueOceanAdvice: Unique strategic positioning advice
    6. scarcityScore: Number 1-100
    7. voiceScript: 15-word emotional hook
    OUTPUT: Strict JSON array.
  `;

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

    const text = response.text || "[]";
    return JSON.parse(text);
  } catch (e: any) {
    console.error("AI Analysis Error:", e);
    if (e.message === "API_KEY_MISSING") throw new Error("Ключ API не настроен в окружении.");
    throw e;
  }
};

export const generateProductVideo = async (
  base64Image: string, 
  prompt: string,
  onProgress?: (status: string) => void
): Promise<string | null> => {
  const ai = getAI();
  try {
    onProgress?.("Инициализация...");
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: `Cinematic product commercial: ${prompt}`,
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
      onProgress?.("Рендеринг...");
      operation = await ai.operations.getVideosOperation({ operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) return null;

    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (e) {
    console.error("Video Error:", e);
    return null;
  }
};

export const generateVoicePitch = async (text: string): Promise<string | null> => {
  const ai = getAI();
  try {
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

    const audioBlob = new Blob([decodeBase64ToUint8(base64Audio)], { type: 'audio/pcm' });
    return URL.createObjectURL(audioBlob);
  } catch (e) {
    return null;
  }
};

export const enhanceImage = async (base64Image: string, title: string): Promise<string | null> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: base64Image.split(',')[1], mimeType: 'image/jpeg' } },
          { text: `Professional product catalog enhancement for: ${title}` }
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
  const ai = getAI();
  const model = 'gemini-3-pro-preview';
  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: query }] }],
      config: { tools: [{ googleSearch: {} }] },
    });
    const text = response.text || "";
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.filter((chunk: any) => chunk.web)
      ?.map((chunk: any) => ({ uri: chunk.web.uri, title: chunk.web.title || "Source" })) || [];
    return { text, sources };
  } catch (e) {
    return { text: "Search Error", sources: [] };
  }
};