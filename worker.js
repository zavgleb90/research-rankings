export default {
  async fetch(request, env) {
    // --- CORS (allow your GitHub Pages site) ---
    const origin = request.headers.get("Origin") || "*";
    const corsHeaders = {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
    }

    // --- Parse input ---
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userText = (body?.message || "").toString().trim();
    const history = Array.isArray(body?.history) ? body.history : [];

    if (!userText) {
      return new Response(JSON.stringify({ error: "message is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Build Gemini contents (simple chat) ---
    // history format expected from frontend:
    // [{ role: "user"|"model", text: "..." }, ...]
    const contents = [
      {
        role: "user",
        parts: [{ text: "You are the Research Rankings assistant. Be concise and academic. If unsure, say so." }],
      },
      ...history.map(m => ({
        role: m.role === "model" ? "model" : "user",
        parts: [{ text: (m.text || "").toString() }],
      })),
      { role: "user", parts: [{ text: userText }] },
    ];

    // --- Call Gemini ---
    const model = env.GEMINI_MODEL || "gemini-1.5-flash";
    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${env.GEMINI_API_KEY}`;

    const geminiResp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 512,
        },
      }),
    });

    const data = await geminiResp.json();

    if (!geminiResp.ok) {
      return new Response(JSON.stringify({ error: "Gemini error", details: data }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const text =
      data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("")?.trim() ||
      "No response.";

    return new Response(JSON.stringify({ reply: text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  },
};
