import { Modality } from "@google/genai";
import { getGeminiClient } from "../server/geminiClient.js";
import { readJson, sendJson, allowOnlyPost, requireApiKey } from "../server/utils.js";

export default async function handler(req, res) {
  if (!allowOnlyPost(req, res)) return;
  if (!requireApiKey(res)) return;

  try {
    const body = await readJson(req);
    const text = (body.text || "").toString().trim();
    if (!text) {
      sendJson(res, 200, { audioBase64: null });
      return;
    }

    const ai = getGeminiClient();
    const model = process.env.GEMINI_TTS_MODEL || "gemini-2.5-flash-preview-tts";

    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: `Say: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } },
        },
      },
    });

    const audioBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
    sendJson(res, 200, { audioBase64 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    sendJson(res, 500, { error: message });
  }
}
