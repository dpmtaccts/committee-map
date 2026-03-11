import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Simple in-memory rate limit (resets on deploy)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(email: string): boolean {
  if (!email) return true;
  const now = Date.now();
  const entry = rateLimitMap.get(email);
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(email, { count: 1, resetAt: now + 24 * 60 * 60 * 1000 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count++;
  return true;
}

interface Role {
  role: string;
  likely_title: string;
  what_they_care_about: string;
  how_they_evaluate: string;
  status: "covered" | "gap" | "risk";
}

interface ApolloOrg {
  name: string;
  logo_url: string | null;
  website_url: string | null;
  estimated_num_employees: number | null;
  industry: string | null;
  short_description: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  organization_revenue_printed: string | null;
  keywords: string[] | null;
}

// ─── Step 1: Enrich company from Apollo ───

async function enrichCompanyFromApollo(
  domain: string
): Promise<{ org: ApolloOrg | null; error?: string }> {
  const apiKey = process.env.APOLLO_API_KEY;
  if (!apiKey) {
    return { org: null, error: "APOLLO_API_KEY not configured" };
  }

  try {
    const res = await fetch(
      `https://api.apollo.io/api/v1/organizations/enrich?domain=${encodeURIComponent(domain)}`,
      {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache",
          "X-Api-Key": apiKey,
        },
      }
    );

    if (res.status === 429) return { org: null, error: "rate_limit" };
    if (res.status === 401) {
      console.error("Apollo auth error");
      return { org: null, error: "auth_error" };
    }
    if (!res.ok) {
      console.error(`Apollo error: ${res.status}`);
      return { org: null, error: `Apollo returned ${res.status}` };
    }

    const data = await res.json();
    const org = data.organization as ApolloOrg | null;
    if (org) {
      console.log(`Apollo org enrichment: ${org.name} — ${org.industry} — ${org.estimated_num_employees} employees`);
    }
    return { org };
  } catch (e) {
    console.error("Apollo enrichment failed:", e);
    return { org: null, error: "network_error" };
  }
}

// ─── Step 2: Generate suggested contacts via Claude ───

async function generateSuggestedContacts(
  org: ApolloOrg | null,
  committeeResult: { roles: Role[]; biggest_risk: string; next_moves: string[]; pattern: string },
  dealInputs: Record<string, unknown>,
  domain: string
) {
  const rolesContext = committeeResult.roles
    .map(
      (r) =>
        `- ${r.role} (likely title: ${r.likely_title}): cares about ${r.what_they_care_about} | evaluates by: ${r.how_they_evaluate} | status: ${r.status}`
    )
    .join("\n");

  const companyContext = org
    ? `Company: ${org.name} (${domain})
Industry: ${org.industry || "unknown"}
Employees: ${org.estimated_num_employees || "unknown"}
Revenue: ${org.organization_revenue_printed || "unknown"}
HQ: ${[org.city, org.state, org.country].filter(Boolean).join(", ") || "unknown"}
Description: ${org.short_description || "none"}
Keywords: ${org.keywords?.slice(0, 15).join(", ") || "none"}`
    : `Company domain: ${domain}`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 3000,
    system: `You are an expert B2B sales strategist. Given real company data, you suggest the most likely people who fill buying committee roles at this specific company. Use realistic names and titles that fit this company's size, industry, and structure. Generate LinkedIn URLs in the format linkedin.com/in/firstname-lastname. Respond ONLY with valid JSON. No markdown backticks. No preamble.`,
    messages: [
      {
        role: "user",
        content: `Generate a relationship map with suggested contacts for this company.

REAL COMPANY DATA:
${companyContext}

BUYING COMMITTEE ROLES NEEDED:
${rolesContext}

DEAL CONTEXT:
${JSON.stringify(dealInputs, null, 2)}

ORIGINAL ANALYSIS:
- Biggest risk: ${committeeResult.biggest_risk}
- Pattern: ${committeeResult.pattern}

INSTRUCTIONS:
1. For each buying committee role, suggest a plausible person who would hold that role at this specific company based on its size, industry, and structure.
2. Generate realistic names and titles. Use LinkedIn URL format: https://linkedin.com/in/firstname-lastname
3. Set status to "gap" for all roles (these are suggested, not confirmed contacts).
4. Generate 2-3 specific "ways in" for each role using the real company context.
5. Calculate a deal_risk_score (0-100).

Return this exact JSON:
{
  "matched_roles": [
    {
      "role": "<role name>",
      "name": "<suggested person name>",
      "title": "<suggested title for this company>",
      "linkedinUrl": "https://linkedin.com/in/firstname-lastname",
      "email": null,
      "status": "gap",
      "what_they_care_about": "<from original role>",
      "how_they_evaluate": "<from original role>",
      "warmth": 0,
      "waysIn": [
        { "type": "mutual|signal|content|event", "icon": "<single emoji>", "text": "<specific actionable text using company context>" }
      ]
    }
  ],
  "deal_risk_score": <0-100>,
  "competitive_signals": ["<signals based on company data>"] or null,
  "biggest_risk": "<risk assessment using company context>",
  "next_moves": ["<specific action 1>", "<action 2>", "<action 3>"],
  "pattern": "<pattern insight>"
}`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type");

  const cleaned = content.text
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
  return JSON.parse(cleaned);
}

// ─── POST handler ───

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { companyDomain, dealInputs, committeeResult, email } = body;

    if (!companyDomain || !committeeResult?.roles) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Rate limiting
    if (email) {
      const allowed = checkRateLimit(email);
      if (!allowed) {
        return NextResponse.json(
          { error: "You've reached the daily enrichment limit. Try again tomorrow." },
          { status: 429 }
        );
      }
    }

    const domain = companyDomain
      .replace(/^https?:\/\//, "")
      .replace(/\/.*$/, "")
      .toLowerCase();

    // Step 1: Get real company data from Apollo
    const { org, error: apolloError } = await enrichCompanyFromApollo(domain);

    if (apolloError === "rate_limit") {
      return NextResponse.json(
        { error: "Too many requests. Try again in a moment." },
        { status: 429 }
      );
    }

    // Step 2: Generate suggested contacts via Claude (using real company context)
    const result = await generateSuggestedContacts(
      org,
      committeeResult,
      dealInputs,
      domain
    );

    // Build company info from Apollo org data
    const hqLocation = org
      ? [org.city, org.state, org.country].filter(Boolean).join(", ") || null
      : null;

    const company = {
      name: org?.name || domain.split(".")[0],
      domain,
      logoUrl: org?.logo_url || `https://logo.clearbit.com/${domain}`,
      industry: org?.industry || null,
      employeeCount: org?.estimated_num_employees || null,
      revenue: org?.organization_revenue_printed || null,
      description: org?.short_description || null,
      techStack: [],
      recentFunding: null,
      hqLocation,
    };

    return NextResponse.json({
      enrichment_available: true,
      suggested_contacts: true,
      company,
      roles: result.matched_roles,
      deal_risk_score: result.deal_risk_score ?? 50,
      competitive_signals: result.competitive_signals || null,
      biggest_risk: result.biggest_risk || committeeResult.biggest_risk,
      next_moves: result.next_moves || committeeResult.next_moves,
      pattern: result.pattern || committeeResult.pattern,
    });
  } catch (e) {
    console.error("enrich-committee error:", e);
    return NextResponse.json({
      enrichment_available: false,
      error: e instanceof Error ? e.message : "Enrichment failed",
    });
  }
}
