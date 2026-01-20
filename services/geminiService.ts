
import { GoogleGenAI, Type } from "@google/genai";
import { Category, TargetAudience, Language } from "../types";

/**
 * Helper to initialize the Google GenAI client using the environment API key.
 * Always uses the named parameter as per SDK requirements.
 */
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Analyzes product images to create strategic Blue Ocean marketing content.
 * Uses gemini-3-flash-preview for general text and JSON generation.
 */
export const analyzeProductImages = async (base64Images: string[], lang: Language = 'ru') => {
  if (!base64Images.length) return [];
  
  const ai = getAI();
  const model = 'gemini-3-flash-preview';
  const langText = lang === 'ru' ? 'Russian' : 'Uzbek';

  const prompt = `
    TASK: Blue Ocean Merchant Strategist.
    Analyze these product images and find an "Unoccupied Market Space".
    
    FOR EACH PRODUCT:
    1. Title: Creative brand name.
    2. blueOceanAdvice: Find one unique reason why people should buy this instead of cheap competitors (Emotional value, Lifestyle hack, or Rare niche).
    3. Category: Choose from [${Object.values(Category).join(', ')}].
    4. Marketing Copy: Compelling post for Telegram in ${langText}.
    5. Price: Premium but fair UZS.

    OUTPUT: Valid JSON array.
  `;

  // Encode images for the multipart request
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
              targetAudience: { type: Type.STRING },
              price: { type: Type.NUMBER },
              description: { type: Type.STRING },
              blueOceanAdvice: { type: Type.STRING }
            },
            required: ["title", "category", "targetAudience", "price", "description", "blueOceanAdvice"]
          }
        }
      }
    });

    // Access .text property directly (not a method) as per SDK rules
    const text = response.text || "[]";
    return JSON.parse(text);
  } catch (e) {
    console.error("AI Strategic Analysis Error:", e);
    return [];
  }
};

/**
 * Enhances an existing image using Gemini's image editing capabilities.
 * Uses gemini-2.5-flash-image for image generation/editing tasks.
 */
export const enhanceImage = async (
  base64Image: string, category: Category, title: string, targetAudience?: TargetAudience, aspectRatio: "1:1" | "9:16" = "1:1"
): Promise<string | null> => {
  const ai = getAI();
  const model = 'gemini-2.5-flash-image';
  const prompt = `Commercial product shot for "${title}". Aesthetic Blue Ocean style: clean, minimalist, high-end lifestyle background, soft azure lighting. Aspect ratio: ${aspectRatio}.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { data: base64Image.split(',')[1], mimeType: 'image/jpeg' } },
          { text: prompt }
        ]
      },
      config: { imageConfig: { aspectRatio } }
    });
    
    // Iterate through parts to find the image part (it may not be the first part)
    const candidate = response.candidates?.[0];
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
  } catch (e) { console.error("Image Enhancement Error:", e); }
  return null;
};

/**
 * Performs market research with Google Search grounding.
 * Extracts sources from groundingMetadata as required.
 */
export const performMarketResearch = async (query: string, lang: Language = 'ru') => {
  const ai = getAI();
  const model = 'gemini-3-flash-preview';
  const langText = lang === 'ru' ? 'in Russian' : 'in Uzbek';
  
  try {
    const response = await ai.models.generateContent({
      model,
      contents: `Perform in-depth market research and competitive analysis on: ${query}. Respond ${langText}.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    // Extract grounding chunks as web sources for the UI
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => ({
        uri: chunk.web?.uri,
        title: chunk.web?.title || 'External Source',
      }))
      .filter((s: any) => s.uri) || [];

    return {
      text: response.text || '',
      sources,
    };
  } catch (e) {
    console.error("Market Research Error:", e);
    return { 
      text: lang === 'ru' ? "Произошла ошибка при анализе рынка." : "Bozor tahlili vaqtida xatolik yuz berdi.", 
      sources: [] 
    };
  }
};
