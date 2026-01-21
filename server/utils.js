export async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("Invalid JSON body");
  }
}

export function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
}

export function allowOnlyPost(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed" });
    return false;
  }
  return true;
}

export function requireApiKey(res) {
  if (!process.env.API_KEY && !process.env.GEMINI_API_KEY) {
    sendJson(res, 500, { error: "Server is missing API_KEY (or GEMINI_API_KEY) env var" });
    return false;
  }
  return true;
}
