import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const BASE_SYSTEM_PROMPT = `You are an expert B2B sales strategist who helps reps build relationship maps for their deals. A relationship map shows every person who influences a deal outcome: who they are, what they care about, how they evaluate, and whether the rep has a relationship with them. You give specific, practical analysis. Write like a senior sales operator giving a peer direct feedback on their deal strategy. Be direct and specific. No generic advice. No filler phrases. Respond ONLY with valid JSON. No markdown backticks. No preamble.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    let prompt: string;
    let systemPrompt: string;

    // Handle new simplified format (backward compat)
    if (body.companyDomain && !body.productType) {
      // New format — redirect to generate-map
      const { companyDomain, roleContext, linkedinUrl } = body;
      const generateRes = await fetch(new URL("/api/generate-map", req.url), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyDomain, roleContext, linkedinUrl }),
      });
      const data = await generateRes.json();
      return NextResponse.json(data, { status: generateRes.status });
    }

    if (body.path === "transcript") {
      systemPrompt = BASE_SYSTEM_PROMPT;

      prompt = `Analyze this discovery call transcript and build a relationship map for the deal:

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
  "biggest_risk": "one paragraph about the biggest relationship gap, referencing specifics from the call",
  "next_moves": ["specific action 1 referencing call context", "specific action 2", "specific action 3"],
  "pattern": "one paragraph insight about deals like this"
}

Rules for status:
- "covered": if this person was on the call or was clearly identified as already engaged
- "risk": if this role can block/kill the deal and wasn't on the call and wasn't mentioned as engaged
- "gap": uncovered roles that should be engaged

Generate 4-6 roles. Reference specific things from the transcript in your analysis.`;
    } else {
      const { productType, industry, buyingDepartment, companySize, dealSize, dealStage, contactLevel } = body;

      systemPrompt = BASE_SYSTEM_PROMPT + ` No hedging. No explanation outside the JSON.`;

      prompt = `Build a relationship map for this deal:

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
  "biggest_risk": "one paragraph about the biggest relationship gap given the missing connections in this deal",
  "next_moves": ["specific action 1", "specific action 2", "specific action 3"],
  "pattern": "one paragraph about what typically happens in deals like this when these relationship gaps exist"
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

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type");
    }

    const cleaned = content.text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const result = JSON.parse(cleaned);

    return NextResponse.json(result);
  } catch (e) {
    console.error("map-committee error:", e);
    const message = e instanceof Error ? e.message : "Unknown error";

    if (message.includes("rate_limit") || message.includes("429")) {
      return NextResponse.json({ error: "Rate limit exceeded. Please try again in a moment." }, { status: 429 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
