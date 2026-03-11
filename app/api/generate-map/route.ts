import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { enrichCompany, searchPeople } from "@/lib/databar";
import type { CompanyData, PersonData } from "@/lib/databar";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function inferDealContext(company: CompanyData | null, roleContext: string | null) {
  const industry = company?.industry || "Technology";
  const employees = company?.employeeCount || 100;

  let companySize = "$10M–$100M";
  if (employees > 1000) companySize = "$500M+";
  else if (employees > 500) companySize = "$100M–$500M";
  else if (employees < 50) companySize = "Under $10M";

  let buyingDepartment = "Sales / Revenue";
  let contactLevel = "VP";
  if (roleContext) {
    const roleLower = roleContext.toLowerCase();
    if (roleLower.includes("marketing")) {
      buyingDepartment = "Marketing";
    } else if (roleLower.includes("operations")) {
      buyingDepartment = "Finance / Operations";
    } else if (roleLower.includes("revenue") || roleLower.includes("cro")) {
      buyingDepartment = "C-Suite / Executive";
      contactLevel = "C-Level";
    }
    if (roleLower.includes("chief")) contactLevel = "C-Level";
    else if (roleLower.includes("head") || roleLower.includes("director")) contactLevel = "Director";
  }

  let dealSize = "$75K";
  if (employees > 1000) dealSize = "$500K+";
  else if (employees > 500) dealSize = "$200K";
  else if (employees < 50) dealSize = "$25K";

  return {
    productType: "Software / Platform",
    industry,
    buyingDepartment,
    companySize,
    dealSize,
    dealStage: "Evaluating",
    contactLevel,
  };
}

function buildCompanyContext(company: CompanyData | null, domain: string) {
  if (!company) return `Company domain: ${domain}`;

  const hq = [company.city, company.state, company.country].filter(Boolean).join(", ") || "unknown";
  return `Company: ${company.name} (${domain})
Industry: ${company.industry || "unknown"}
Employees: ${company.employeeCount || "unknown"}
Revenue: ${company.revenue || "unknown"}
HQ: ${hq}
Description: ${company.description || "none"}
Keywords: ${company.keywords?.slice(0, 15).join(", ") || "none"}`;
}

function buildPeopleContext(people: PersonData[]) {
  if (people.length === 0) return "";
  const lines = people.slice(0, 20).map(
    (p) => `- ${p.name}: ${p.title || "unknown title"}${p.email ? ` (${p.email})` : ""}${p.linkedinUrl ? ` [LinkedIn: ${p.linkedinUrl}]` : ""}`
  );
  return `\n\nREAL PEOPLE FOUND AT THIS COMPANY:\n${lines.join("\n")}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { companyDomain, roleContext, linkedinUrl } = body;

    if (!companyDomain) {
      return NextResponse.json({ error: "Company domain is required" }, { status: 400 });
    }

    const domain = companyDomain
      .replace(/^https?:\/\//, "")
      .replace(/\/.*$/, "")
      .toLowerCase();

    // Step 1: Enrich company + search people (in parallel)
    const [companyResult, peopleResult] = await Promise.all([
      enrichCompany(domain),
      searchPeople(domain),
    ]);

    const { company, source: companySource } = companyResult;
    const { people } = peopleResult;

    console.log(`Enrichment sources — company: ${companySource}, people: ${peopleResult.source} (${people.length} found)`);

    // Step 2: Infer deal context
    const dealContext = inferDealContext(company, roleContext);

    const companyContext = buildCompanyContext(company, domain);
    const peopleContext = buildPeopleContext(people);

    const roleDescription = linkedinUrl
      ? `The user provided a LinkedIn profile: ${linkedinUrl}. Use this to understand the person's role and seniority.`
      : roleContext
      ? `The user is mapping for or around someone in the role of: ${roleContext}`
      : "No specific role context provided.";

    // Step 3: Generate full committee map with Claude
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 3000,
      system: `You are an expert B2B sales strategist who helps reps build relationship maps for their deals. Given real company data, you map the buying committee, suggest likely contacts, and provide actionable analysis. Be direct and specific. No generic advice. Respond ONLY with valid JSON. No markdown backticks. No preamble.`,
      messages: [
        {
          role: "user",
          content: `Build a complete relationship map for this deal.

REAL COMPANY DATA:
${companyContext}${peopleContext}

ROLE CONTEXT:
${roleDescription}

INFERRED DEAL CONTEXT:
Product type: ${dealContext.productType}
Industry: ${dealContext.industry}
Buying department: ${dealContext.buyingDepartment}
Company size: ${dealContext.companySize}
Deal size: ${dealContext.dealSize}
Deal stage: ${dealContext.dealStage}
Contact level: ${dealContext.contactLevel}

INSTRUCTIONS:
1. Generate 4-6 buying committee roles relevant to this company and deal type.
2. For each role, ${people.length > 0 ? "match real people from the REAL PEOPLE list above when possible. For unmatched roles, suggest plausible people." : "suggest a plausible person who would hold that role at this specific company based on its size, industry, and structure."}
3. ${people.length > 0 ? "Use real names, titles, and LinkedIn URLs from the data when available." : "Generate realistic names and titles. Use LinkedIn URL format: https://linkedin.com/in/firstname-lastname"}
4. Set status: "covered" only if the role context suggests coverage, "risk" for roles that can block the deal, "gap" for others.
5. Generate 2-3 specific "ways in" for each role using the real company context.
6. Calculate a deal_risk_score (0-100).

Return this exact JSON:
{
  "matched_roles": [
    {
      "role": "Economic Buyer",
      "name": "<person name>",
      "title": "<title for this company>",
      "linkedinUrl": "https://linkedin.com/in/firstname-lastname",
      "email": null,
      "status": "covered|gap|risk",
      "what_they_care_about": "<one sentence specific to this company>",
      "how_they_evaluate": "<one sentence specific to this deal type>",
      "warmth": <0-100>,
      "waysIn": [
        { "type": "mutual|signal|content|event", "icon": "<single emoji>", "text": "<specific actionable text using company context>" }
      ]
    }
  ],
  "deal_risk_score": <0-100>,
  "competitive_signals": ["<signals based on company data>"] or null,
  "biggest_risk": "<one paragraph about the biggest relationship gap using company context>",
  "next_moves": ["<specific action 1>", "<action 2>", "<action 3>"],
  "pattern": "<one paragraph insight about deals like this at companies like this>"
}

Rules for role generation:
- Always include: Economic Buyer, Champion, Technical Evaluator
- Add Coach if deal size is $75K+ or stage is Evaluating/Proposal
- Add Blocker if deal size is $200K+ or stage is Proposal/Stalled
- Add End User if product type is Software/Platform and deal size is $75K+
- Likely titles must be specific to the industry. "VP of Marketing" not "Senior Executive."
- Make every sentence specific to this exact company and deal context.`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") throw new Error("Unexpected response type");

    const cleaned = content.text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const result = JSON.parse(cleaned);

    // Build company info for response
    const hqLocation = company
      ? [company.city, company.state, company.country].filter(Boolean).join(", ") || null
      : null;

    const companyInfo = {
      name: company?.name || domain.split(".")[0].charAt(0).toUpperCase() + domain.split(".")[0].slice(1),
      domain,
      logoUrl: company?.logoUrl || `https://logo.clearbit.com/${domain}`,
      industry: company?.industry || null,
      employeeCount: company?.employeeCount || null,
      revenue: company?.revenue || null,
      description: company?.description || null,
      techStack: [],
      recentFunding: null,
      hqLocation,
    };

    return NextResponse.json({
      enrichment_available: !!company,
      suggested_contacts: people.length === 0,
      company: companyInfo,
      roles: result.matched_roles,
      deal_risk_score: result.deal_risk_score ?? 50,
      competitive_signals: result.competitive_signals || null,
      biggest_risk: result.biggest_risk,
      next_moves: result.next_moves,
      pattern: result.pattern,
    });
  } catch (e) {
    console.error("generate-map error:", e);
    const message = e instanceof Error ? e.message : "Unknown error";

    if (message.includes("rate_limit") || message.includes("429")) {
      return NextResponse.json({ error: "Rate limit exceeded. Please try again in a moment." }, { status: 429 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
