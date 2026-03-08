import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let prompt: string;
    let systemPrompt: string;

    if (body.path === "transcript") {
      // Path B: Transcript
      systemPrompt = `You are an expert B2B sales strategist who analyzes discovery calls and maps buying committees. You extract deal context from transcripts and give specific, practical analysis. Write like a senior sales operator giving a peer direct feedback. Be direct and specific. No generic advice. No filler phrases. Respond ONLY with valid JSON. No markdown backticks. No preamble.`;

      prompt = `Analyze this discovery call transcript and map the buying committee:

--- TRANSCRIPT START ---
${body.transcriptContent}
--- TRANSCRIPT END ---

First, extract the deal context from the transcript:
- What does the selling company offer?
- What industry is the prospect in?
- Who was on the call and what are their titles/roles?
- What's the approximate deal size (based on scope discussed)?
- What stage is the deal in (based on the conversation)?
- What pain points or needs were discussed?
- Were any other stakeholders or decision-makers mentioned?

Then, using that context, return a JSON object with this exact structure:
{
  "deal_summary": "one sentence summarizing the deal based on the transcript",
  "roles": [
    {
      "role": "Economic Buyer",
      "likely_title": "specific title based on what was discussed",
      "what_they_care_about": "one sentence, informed by transcript context",
      "how_they_evaluate": "one sentence, informed by transcript context",
      "status": "covered|gap|risk"
    }
  ],
  "biggest_risk": "one paragraph about their specific exposure, referencing specifics from the call",
  "next_moves": ["specific action 1 referencing call context", "specific action 2", "specific action 3"],
  "pattern": "one paragraph insight about deals like this"
}

Rules for status:
- "covered": if this person was on the call or was clearly identified as already engaged
- "risk": if this role can block/kill the deal and wasn't on the call and wasn't mentioned as engaged
- "gap": uncovered roles that should be engaged

Generate 4-6 roles. Reference specific things from the transcript in your analysis.`;
    } else {
      // Path A: Quick Map
      const { productType, industry, buyingDepartment, companySize, dealSize, dealStage, contactLevel } = body;

      systemPrompt = `You are an expert B2B sales strategist who maps buying committees. You give specific, practical analysis based on deal context. Write like a senior sales operator giving a peer direct feedback. Be direct and specific. No generic advice. No filler phrases. No hedging. Respond ONLY with valid JSON. No markdown backticks. No preamble. No explanation outside the JSON.`;

      prompt = `Map the buying committee for this deal:

Product type: ${productType}
Industry: ${industry}
Buying department: ${buyingDepartment}
Company size: ${companySize}
Deal size: ${dealSize}
Deal stage: ${dealStage}
Current contact level: ${contactLevel}

Return a JSON object with this exact structure:
{
  "roles": [
    {
      "role": "Economic Buyer",
      "likely_title": "specific title for this industry and company size",
      "what_they_care_about": "one sentence, specific to this deal type",
      "how_they_evaluate": "one sentence, specific to this deal type",
      "status": "covered|gap|risk"
    }
  ],
  "biggest_risk": "one paragraph about their specific exposure given the gaps in committee coverage",
  "next_moves": ["specific action 1", "specific action 2", "specific action 3"],
  "pattern": "one paragraph about what typically happens in deals like this when these committee gaps exist"
}

Rules for status assignment:
- "covered": only if the current contact level clearly matches this role (e.g., C-Level contact covers Economic Buyer, VP contact might cover Champion)
- "risk": if this role can block or kill the deal and is not covered. Economic Buyer is always risk if not covered. Any Blocker role is always risk.
- "gap": uncovered roles that should be engaged but are less likely to kill the deal alone

Rules for role generation:
- Always include: Economic Buyer, Champion, Technical Evaluator
- Add Coach if deal size is $75K+ or stage is Evaluating/Proposal
- Add Blocker if deal size is $200K+ or stage is Proposal/Stalled
- Add End User if the product type is Software/Platform and deal size is $75K+
- Total roles: 4-6 depending on deal complexity
- Likely titles must be specific to the industry and buying department. "VP of Marketing" not "Senior Executive."
- Make every sentence specific to this exact deal context. Reference the industry, the product type, the deal size.`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
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
