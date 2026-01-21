import { Language } from "../types";

async function postJSON(path: string, body: any) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  // Attempt to parse JSON even on errors (Vercel functions return JSON).
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = (data && (data.error || data.message)) || `Request failed: ${res.status}`;
    throw new Error(message);
  }

  return data;
}

function decodeBase64ToUint8(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

export const analyzeProductImages = async (base64Images: string[], lang: Language = "ru") => {
  if (!base64Images.length) return [];
  return await postJSON("/api/analyze-product-images", { base64Images, lang });
};

export const generateProductVideo = async (
  base64Image: string,
  prompt: string,
  onProgress?: (status: string) => void
): Promise<string | null> => {
  try {
    onProgress?.("Generating video...");
    const data = await postJSON("/api/generate-product-video", { base64Image, prompt });
    return data?.videoUrl || null;
  } catch (e) {
    // Video generation is optional; keep UI stable.
    console.error("Video generation error:", e);
    onProgress?.("");
    return null;
  }
};

export const generateVoicePitch = async (text: string): Promise<string | null> => {
  try {
    const data = await postJSON("/api/voice-pitch", { text });
    const base64Audio = data?.audioBase64;
    if (!base64Audio) return null;
    return URL.createObjectURL(new Blob([decodeBase64ToUint8(base64Audio)], { type: "audio/pcm" }));
  } catch (e) {
    console.error("TTS Error:", e);
    return null;
  }
};

export const enhanceImage = async (base64Image: string, title: string): Promise<string | null> => {
  try {
    const data = await postJSON("/api/enhance-image", { base64Image, title });
    const imageBase64 = data?.imageBase64;
    return imageBase64 ? `data:image/png;base64,${imageBase64}` : null;
  } catch (e) {
    console.error("Image Enhancement Error:", e);
    return null;
  }
};

export const performMarketResearch = async (query: string, lang: Language = "ru") => {
  try {
    return await postJSON("/api/market-research", { query, lang });
  } catch (e) {
    console.error("Research Error:", e);
    return { text: "Ошибка при проведении исследования рынка.", sources: [] };
  }
};
