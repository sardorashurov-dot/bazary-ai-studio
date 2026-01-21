import { GoogleGenAI } from "@google/genai";

let client;

/**
 * Returns a cached Gemini client (GoogleGenAI).
 * Uses process.env.API_KEY (set in Vercel Environment Variables).
 */
export function getGeminiClient() {
  if (client) return client;
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY (or GEMINI_API_KEY) not set");
  }
  client = new GoogleGenAI({ apiKey });
  return client;
}
