import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { whatTheySell, companySize, dealSize, primaryContact, dealStage } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const prompt = `Map the buying committee for this deal:

Product/service: ${whatTheySell}
Company segment: ${companySize}
Deal size: ${dealSize}
Primary contact title: ${primaryContact}
Deal stage: ${dealStage}

Return a JSON object with this exact structure:
{
  "roles": [
    {
      "role": "Economic Buyer",
      "likely_title": "specific title for this company size",
      "what_they_care_about": "one sentence",
      "how_they_evaluate": "one sentence",
      "status": "covered|gap|risk"
    }
  ],
  "biggest_risk": "one paragraph about their specific exposure given the gaps",
  "next_moves": ["specific action 1", "specific action 2", "specific action 3"],
  "pattern": "one paragraph insight about what typically happens in deals like this when these roles aren't covered"
}

Rules for status assignment:
- "covered": only if the primary contact title clearly matches this role
- "risk": if this role can block or kill the deal and isn't the primary contact (Economic Buyer is almost always risk if not covered, Blockers are always risk)
- "gap": all other uncovered roles that should be engaged

Generate 4-6 roles. Always include Economic Buyer, Champion, and Technical Evaluator. Add Coach, Blocker, or End User based on the deal size and complexity. Larger deals and later stages should have more roles.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: "You are an expert B2B sales strategist who helps reps understand and map buying committees. You give specific, practical advice based on the deal context provided. Write like a senior sales operator giving a peer direct feedback. Be direct. No generic advice. No filler. Respond ONLY with valid JSON, no markdown backticks, no preamble.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("No content in AI response");

    // Clean markdown fences if present
    const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const result = JSON.parse(cleaned);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("map-committee error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
