// supabase/functions/gemini-recommend/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_INSTRUCTION = `
You are the Roominate Campus Assistant. Your ONLY purpose is to recommend campus study rooms or event spaces.
RULES:
1. Only return room recommendations. 
2. If the user asks for anything else (jokes, general info, math, etc.), politely explain that you can only help find rooms.
3. Be specific. Mention room numbers and buildings (e.g., "ECSW 2.323").
4. Analyze the user's needs for capacity, technology, and date.
5. You MUST return your answer in valid JSON format with a "recommendations" array.
6. Each recommendation object must have: "room", "building", "capacity", and "reason".

EXAMPLE JSON OUTPUT:
{
  "recommendations": [
    {
      "room": "LIB 4.400",
      "building": "McDermott Library",
      "capacity": 20,
      "reason": "Quiet space with a projector, perfect for your study group."
    }
  ]
}
`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { query } = await req.json();

    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: "Gemini API key not configured." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: SYSTEM_INSTRUCTION },
              { text: `User request: ${query}` }
            ]
          }
        ],
        generationConfig: {
          response_mime_type: "application/json",
        }
      }),
    });

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!resultText) {
      throw new Error("Empty response from Gemini");
    }

    // Parse the JSON string from Gemini
    const parsed = JSON.parse(resultText);

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
