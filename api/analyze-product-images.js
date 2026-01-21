import { Type } from "@google/genai";
import { getGeminiClient } from "../server/geminiClient.js";
import { readJson, sendJson, allowOnlyPost, requireApiKey } from "../server/utils.js";

export default async function handler(req, res) {
  if (!allowOnlyPost(req, res)) return;
  if (!requireApiKey(res)) return;

  try {
    const body = await readJson(req);
    const base64Images = Array.isArray(body.base64Images) ? body.base64Images : [];
    const lang = body.lang === "uzb" ? "uzb" : "ru";

    if (!base64Images.length) {
      sendJson(res, 200, []);
      return;
    }

    const langText = lang === "ru" ? "Russian" : "Uzbek";
    const prompt =
      `Analyze these product images. Return JSON array with: title, category, price (number), ` +
      `description (in ${langText}), blueOceanAdvice, scarcityScore (1-100), voiceScript. ` +
      `Output strict JSON only.`;

    const imageParts = base64Images.map((base64) => ({
      inlineData: {
        mimeType: "image/jpeg",
        data: typeof base64 === "string" && base64.includes(",") ? base64.split(",")[1] : base64,
      },
    }));

    const ai = getGeminiClient();
    const model = process.env.GEMINI_ANALYZE_MODEL || "gemini-2.5-flash";

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
              voiceScript: { type: Type.STRING },
            },
            required: ["title", "category", "price", "description", "blueOceanAdvice", "scarcityScore", "voiceScript"],
          },
        },
      },
    });

    const text = response.text || "";
    if (!text) throw new Error("Empty response from AI");

    sendJson(res, 200, JSON.parse(text));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    sendJson(res, 500, { error: message });
  }
}
