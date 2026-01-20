
import { GoogleGenAI, Type } from "@google/genai";
import { Category, TargetAudience, Language } from "../types";

const getAI = () => {
  const envKey = process.env.API_KEY;
  const localKey = localStorage.getItem('bazary_standalone_key');
  const key = envKey || localKey || '';
  return new GoogleGenAI({ apiKey: key });
};

export const analyzeProductImages = async (base64Images: string[], lang: Language = 'ru') => {
  if (!base64Images.length) return [];
  
  const ai = getAI();
  const model = 'gemini-3-flash-preview';
  
  const langText = lang === 'ru' ? 'Russian' : 'Uzbek';

  const prompt = `
    TASK: You are an E-commerce Expert. Analyze the provided ${base64Images.length} images.
    INSTRUCTIONS:
    1. For EACH image, create a product listing. 
    2. You MUST return exactly ${base64Images.length} items in the JSON array.
    3. Category must be one of: ${Object.values(Category).join(', ')}.
    4. TargetAudience must be one of: ${Object.values(TargetAudience).join(', ')}.
    5. Price: Suggest a realistic price in UZS (numbers only).
    6. Description: Create a catchy social media post with emojis in ${langText} language.
    7. Title: Short and professional in ${langText} language.

    FORMAT: Return ONLY a valid JSON array of objects.
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
      contents: [{ parts: [...imageParts, { text: prompt }] }],
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
              description: { type: Type.STRING }
            },
            required: ["title", "category", "targetAudience", "price", "description"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (e) {
    console.error("Gemini Analysis Error:", e);
    return base64Images.map((_, i) => ({
      title: `Product ${i + 1}`,
      category: Category.OTHER,
      targetAudience: TargetAudience.NONE,
      price: 0,
      description: "AI failed to generate description."
    }));
  }
};

export const enhanceImage = async (
  base64Image: string, 
  category: Category, 
  title: string,
  targetAudience?: TargetAudience,
  aspectRatio: "1:1" | "9:16" = "1:1"
): Promise<string | null> => {
  const ai = getAI();
  const model = 'gemini-2.5-flash-image';
  
  let lifestyleContext = "";
  if ([Category.CLOTHING, Category.SHOES, Category.ACCESSORIES].includes(category)) {
    lifestyleContext = `professional high-end studio fashion setup, soft box lighting, clean solid background.`;
  } else if (category === Category.HOME_LIVING) {
    lifestyleContext = `modern aesthetic interior, natural soft architectural light, premium catalog setting.`;
  } else {
    lifestyleContext = `minimalist commercial product photography background with professional studio shadows.`;
  }

  const prompt = `
    STRICT INSTRUCTION: DO NOT CHANGE THE PRODUCT ITSELF. 
    Keep the product from this image exactly as it is in its original shape, color, and texture. 
    Task: Replace the background and lighting with a ${lifestyleContext} for the product "${title}". 
    The final image should look like a professional high-end advertising studio shot. 
    Style: ${aspectRatio} format commercial photography.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { data: base64Image.includes(',') ? base64Image.split(',')[1] : base64Image, mimeType: 'image/jpeg' } },
          { text: prompt },
        ],
      },
      config: {
        imageConfig: { aspectRatio }
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
  } catch (e) {
    console.error("Enhance error:", e);
  }
  return null;
};

export const generateProductVideo = async (
  base64Image: string, 
  productTitle: string,
  aspectRatio: "9:16" | "16:9" = "9:16",
  onStatusChange?: (status: string) => void
): Promise<string | null> => {
  const ai = getAI();
  onStatusChange?.("Initializing AI Video Engine...");
  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: `Premium commercial showcase for ${productTitle}. Cinematic lighting, smooth camera movement, high-end production value, ${aspectRatio} format.`,
      image: { imageBytes: base64Image.includes(',') ? base64Image.split(',')[1] : base64Image, mimeType: 'image/jpeg' },
      config: { numberOfVideos: 1, resolution: '720p', aspectRatio }
    });
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      onStatusChange?.("Rendering cinematic frames...");
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }
    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) return null;
    const key = process.env.API_KEY || localStorage.getItem('bazary_standalone_key') || '';
    const videoResponse = await fetch(`${downloadLink}&key=${key}`);
    const videoBlob = await videoResponse.blob();
    return URL.createObjectURL(videoBlob);
  } catch (error) {
    console.error("Video error:", error);
    return null;
  }
};
