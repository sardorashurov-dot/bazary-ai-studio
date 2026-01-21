import { getGeminiClient } from "../server/geminiClient.js";
import { readJson, sendJson, allowOnlyPost, requireApiKey } from "../server/utils.js";

export default async function handler(req, res) {
  if (!allowOnlyPost(req, res)) return;
  if (!requireApiKey(res)) return;

  try {
    const body = await readJson(req);
    const query = (body.query || "").toString().trim();
    const lang = body.lang === "uzb" ? "uzb" : "ru";

    if (!query) {
      sendJson(res, 400, { error: "Missing query" });
      return;
    }

    const ai = getGeminiClient();
    const model = process.env.GEMINI_RESEARCH_MODEL || "gemini-2.5-pro";

    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: query }] }],
      config: {
        // googleSearch может быть недоступен для некоторых ключей/регионов.
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "";
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = (Array.isArray(chunks) ? chunks : [])
      .filter((c) => c && c.web && c.web.uri)
      .map((c) => ({ uri: c.web.uri, title: c.web.title || "Source" }));

    sendJson(res, 200, { text, sources });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    sendJson(res, 500, { error: message });
  }
}
