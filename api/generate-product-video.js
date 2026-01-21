import { sendJson, allowOnlyPost } from "../server/utils.js";

/**
 * Video generation (Veo) is not enabled by default in this template.
 * Many Gemini API keys do not have access to Veo models.
 *
 * If you have access, you can implement this endpoint using the Google GenAI SDK
 * and keep your API key on the server.
 */
export default async function handler(req, res) {
  if (!allowOnlyPost(req, res)) return;
  sendJson(res, 501, {
    error: "Video generation is not enabled on the server (Veo access required).",
  });
}
