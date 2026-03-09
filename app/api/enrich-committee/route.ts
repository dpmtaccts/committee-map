import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { Pool } from "pg";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Rate limit: max 10 enrichment requests per email per day
async function checkRateLimit(email: string): Promise<boolean> {
  if (!email || !process.env.DATABASE_URL) return true; // skip if no DB
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const res = await pool.query(
      `SELECT COUNT(*) as count FROM submissions WHERE email = $1 AND results->>'enrichment_available' = 'true' AND created_at > NOW() - INTERVAL '24 hours'`,
      [email]
    );
    return parseInt(res.rows[0].count) < 10;
  } catch {
    return true; // allow on DB error
  } finally {
    await pool.end();
  }
}

interface Role {
  role: string;
  likely_title: string;
  what_they_care_about: string;
  how_they_evaluate: string;
  status: "covered" | "gap" | "risk";
}

interface CompanyData {
  name: string;
  domain: string;
  employeeCount: number | null;
  revenue: string | null;
  industry: string | null;
  techStack: string[];
  recentFunding: string | null;
  hqLocation: string | null;
}

interface EnrichedContact {
  fullName: string;
  title: string;
  linkedinUrl: string | null;
  email: string | null;
}

// STEP 1: Company enrichment via Databar
async function enrichCompany(domain: string): Promise<CompanyData | null> {
  const apiKey = process.env.DATABAR_API_KEY;
  if (!apiKey) {
    console.warn("DATABAR_API_KEY not set, skipping company enrichment");
    return null;
  }

  try {
    const res = await fetch("https://api.databar.ai/api/v1/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source: "company_enrichment",
        query: { domain },
      }),
    });

    if (!res.ok) {
      console.error("Databar API error:", res.status, await res.text());
      return null;
    }

    const data = await res.json();
    const company = data?.results?.[0] || data?.data?.[0] || data;

    return {
      name: company.name || company.company_name || domain.split(".")[0],
      domain,
      employeeCount: company.employee_count || company.employees || null,
      revenue: company.revenue || company.estimated_revenue || null,
      industry: company.industry || company.sector || null,
      techStack: company.tech_stack || company.technologies || [],
      recentFunding: company.last_funding_round || company.recent_funding || null,
      hqLocation: company.hq_location || company.headquarters || company.location || null,
    };
  } catch (e) {
    console.error("Databar enrichment failed:", e);
    return null;
  }
}

// STEP 2: Contact enrichment via Clay
async function enrichContacts(
  domain: string,
  roles: Role[]
): Promise<Map<string, EnrichedContact>> {
  const apiKey = process.env.CLAY_API_KEY;
  const contactMap = new Map<string, EnrichedContact>();

  if (!apiKey) {
    console.warn("CLAY_API_KEY not set, skipping contact enrichment");
    return contactMap;
  }

  try {
    const res = await fetch("https://api.clay.com/v3/find-and-enrich-contacts-at-company", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        company_domain: domain,
        titles: roles.map((r) => r.likely_title),
        limit: roles.length * 2,
      }),
    });

    if (!res.ok) {
      console.error("Clay API error:", res.status, await res.text());
      return contactMap;
    }

    const data = await res.json();
    const contacts: any[] = data?.contacts || data?.results || data?.people || [];

    // Match each contact to the closest role by title similarity
    for (const contact of contacts) {
      const contactTitle = (contact.title || contact.job_title || "").toLowerCase();
      const contactName = contact.full_name || contact.name || `${contact.first_name || ""} ${contact.last_name || ""}`.trim();

      if (!contactName) continue;

      let bestRole: string | null = null;
      let bestScore = 0;

      for (const role of roles) {
        if (contactMap.has(role.role)) continue; // already matched
        const roleTitle = role.likely_title.toLowerCase();
        const words = roleTitle.split(/\s+/);
        const matchCount = words.filter((w) => contactTitle.includes(w)).length;
        const score = matchCount / words.length;
        if (score > bestScore) {
          bestScore = score;
          bestRole = role.role;
        }
      }

      if (bestRole && bestScore > 0.3) {
        contactMap.set(bestRole, {
          fullName: contactName,
          title: contact.title || contact.job_title || "",
          linkedinUrl: contact.linkedin_url || contact.linkedin || null,
          email: contact.email || contact.work_email || null,
        });
      }
    }

    return contactMap;
  } catch (e) {
    console.error("Clay enrichment failed:", e);
    return contactMap;
  }
}

// STEP 3: Generate "Ways In" via Claude
async function generateWaysIn(
  roles: any[],
  company: CompanyData | null,
  dealInputs: any,
  committeeResult: any
) {
  const companyContext = company
    ? `Company: ${company.name} (${company.domain})
Employee count: ${company.employeeCount || "unknown"}
Revenue: ${company.revenue || "unknown"}
Industry: ${company.industry || "unknown"}
Tech stack: ${company.techStack?.join(", ") || "unknown"}
Recent funding: ${company.recentFunding || "none detected"}
HQ: ${company.hqLocation || "unknown"}`
    : `Company domain: ${dealInputs.companyDomain || "unknown"}`;

  const rolesContext = roles
    .map(
      (r: any) =>
        `- ${r.role}: ${r.name || "Unknown"} (${r.title || r.likely_title}), status: ${r.status}`
    )
    .join("\n");

  const systemPrompt = `You are an expert B2B sales strategist. Given this buying committee with real people and company context, generate specific "ways in" for each contact. Focus on: mutual connection opportunities (based on their background/company), recent public signals (job changes, posts, conference appearances, company news), content angles that would resonate with their role and stated concerns, and trigger events that create urgency. Be specific and actionable. No generic advice. Respond ONLY with valid JSON. No markdown backticks. No preamble.`;

  const prompt = `Given this deal context and relationship map, generate ways in and a risk assessment.

${companyContext}

Deal context:
${JSON.stringify(dealInputs, null, 2)}

Relationship map:
${rolesContext}

Original analysis:
- Biggest risk: ${committeeResult.biggest_risk}
- Pattern: ${committeeResult.pattern}

Return this exact JSON structure:
{
  "roles_ways_in": {
    "<role name>": [
      { "type": "mutual|signal|content|event", "icon": "<single emoji>", "text": "<specific actionable text>" }
    ]
  },
  "deal_risk_score": <0-100 number based on: committee coverage gaps, seniority gaps, deal stage risk, number of paths into uncovered roles. Lower = less risk>,
  "competitive_signals": ["<any competitive signals from company data>"] or null,
  "biggest_risk": "<regenerated risk paragraph using real names where available>",
  "next_moves": ["<specific move 1 using real names/ways in>", "<move 2>", "<move 3>"],
  "pattern": "<regenerated pattern insight>"
}

For each role, generate 2-3 ways_in entries. Use these type mappings:
- "mutual": mutual connections, shared networks, alumni
- "signal": job changes, LinkedIn posts, conference appearances
- "content": content angles, case studies, thought leadership
- "event": trigger events, company changes, market shifts

Make the deal_risk_score reflect: how many roles are covered vs gap/risk, whether Economic Buyer is covered, seniority of current contact vs needed, and deal stage urgency.`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 3000,
    system: systemPrompt,
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type");

  const cleaned = content.text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(cleaned);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { companyDomain, dealInputs, committeeResult, email } = body;

    if (!companyDomain || !committeeResult?.roles) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Rate limiting
    if (email) {
      const allowed = await checkRateLimit(email);
      if (!allowed) {
        return NextResponse.json(
          { error: "You've reached the daily enrichment limit. Try again tomorrow." },
          { status: 429 }
        );
      }
    }

    const domain = companyDomain.replace(/^https?:\/\//, "").replace(/\/.*$/, "").toLowerCase();

    // Run company and contact enrichment in parallel
    const [company, contactMap] = await Promise.all([
      enrichCompany(domain),
      enrichContacts(domain, committeeResult.roles),
    ]);

    // Build enriched roles
    const enrichedRoles = committeeResult.roles.map((role: Role) => {
      const contact = contactMap.get(role.role);
      return {
        ...role,
        name: contact?.fullName || null,
        title: contact?.title || role.likely_title,
        linkedinUrl: contact?.linkedinUrl || null,
        email: contact?.email || null,
        warmth: contact ? estimateWarmth(role.status, !!contact.linkedinUrl) : 0,
        waysIn: [],
      };
    });

    // Generate ways in via Claude
    try {
      const waysInResult = await generateWaysIn(
        enrichedRoles,
        company,
        dealInputs,
        committeeResult
      );

      // Merge ways_in into roles
      for (const role of enrichedRoles) {
        const roleWaysIn = waysInResult.roles_ways_in?.[role.role];
        if (roleWaysIn) {
          role.waysIn = roleWaysIn;
        }
      }

      return NextResponse.json({
        enrichment_available: true,
        company: company || {
          name: domain.split(".")[0],
          domain,
          employeeCount: null,
          revenue: null,
          industry: null,
          techStack: [],
          recentFunding: null,
          hqLocation: null,
        },
        roles: enrichedRoles,
        deal_risk_score: waysInResult.deal_risk_score ?? 50,
        competitive_signals: waysInResult.competitive_signals || null,
        biggest_risk: waysInResult.biggest_risk || committeeResult.biggest_risk,
        next_moves: waysInResult.next_moves || committeeResult.next_moves,
        pattern: waysInResult.pattern || committeeResult.pattern,
      });
    } catch (e) {
      console.error("Ways-in generation failed:", e);
      // Fall back: return enriched roles without ways in
      return NextResponse.json({
        enrichment_available: true,
        company: company || {
          name: domain.split(".")[0],
          domain,
          employeeCount: null,
          revenue: null,
          industry: null,
          techStack: [],
          recentFunding: null,
          hqLocation: null,
        },
        roles: enrichedRoles,
        deal_risk_score: 50,
        competitive_signals: null,
        biggest_risk: committeeResult.biggest_risk,
        next_moves: committeeResult.next_moves,
        pattern: committeeResult.pattern,
      });
    }
  } catch (e) {
    console.error("enrich-committee error:", e);
    // Graceful fallback
    return NextResponse.json({
      enrichment_available: false,
      error: e instanceof Error ? e.message : "Enrichment failed",
    });
  }
}

function estimateWarmth(status: string, hasLinkedIn: boolean): number {
  let base = 0;
  if (status === "covered") base = 65;
  else if (status === "gap") base = 20;
  else base = 10;
  if (hasLinkedIn) base += 15;
  return Math.min(base, 100);
}
