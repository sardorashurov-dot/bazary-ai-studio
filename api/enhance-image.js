import { getGeminiClient } from "../server/geminiClient.js";
import { readJson, sendJson, allowOnlyPost, requireApiKey } from "../server/utils.js";

export default async function handler(req, res) {
  if (!allowOnlyPost(req, res)) return;
  if (!requireApiKey(res)) return;

  try {
    const body = await readJson(req);
    const base64Image = (body.base64Image || "").toString();
    const title = (body.title || "").toString();

    if (!base64Image) {
      sendJson(res, 200, { imageBase64: null });
      return;
    }

    const data = base64Image.includes(",") ? base64Image.split(",")[1] : base64Image;
    const ai = getGeminiClient();
    const model = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";

    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { data, mimeType: "image/jpeg" } },
          { text: `Enhance for e-commerce: ${title}` },
        ],
      },
    });

    const parts = response.candidates?.[0]?.content?.parts || [];
    const inline = parts.find((p) => p && p.inlineData && p.inlineData.data);
    const imageBase64 = inline?.inlineData?.data || null;

    sendJson(res, 200, { imageBase64 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    sendJson(res, 500, { error: message });
  }
}
