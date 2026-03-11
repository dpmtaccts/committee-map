/**
 * Databar.ai API wrapper for company enrichment and people search.
 * Falls back to Apollo if Databar returns no results or errors.
 */

const DATABAR_BASE = "https://api.databar.ai/v1";

function getDatabarHeaders() {
  return {
    "x-apikey": process.env.DATABAR_API_KEY!,
    "Content-Type": "application/json",
  };
}

// Normalized company data (provider-agnostic)
export interface CompanyData {
  name: string;
  domain: string;
  logoUrl: string | null;
  industry: string | null;
  employeeCount: number | null;
  revenue: string | null;
  description: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  keywords: string[];
}

// Normalized person data
export interface PersonData {
  name: string;
  title: string | null;
  email: string | null;
  linkedinUrl: string | null;
}

// ─── Databar core: run enrichment + poll ───

async function runEnrichment(
  enrichmentId: number,
  params: Record<string, unknown>
): Promise<string> {
  const res = await fetch(`${DATABAR_BASE}/enrichments/${enrichmentId}/run`, {
    method: "POST",
    headers: getDatabarHeaders(),
    body: JSON.stringify({ params }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Databar run failed (${res.status}): ${text}`);
  }

  const task = await res.json();
  return task.request_id;
}

async function pollTask(
  taskId: string,
  maxAttempts = 15,
  intervalMs = 2000
): Promise<unknown[]> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, intervalMs));
    const res = await fetch(`${DATABAR_BASE}/tasks/${taskId}`, {
      headers: getDatabarHeaders(),
    });

    if (!res.ok) throw new Error(`Databar poll failed (${res.status})`);

    const task = await res.json();
    if (task.status === "completed") return task.data || [];
    if (task.status === "failed") throw new Error(task.error || "Task failed");
    if (task.status === "gone") throw new Error("Task data expired");
  }
  throw new Error("Databar polling timeout");
}

async function enrichSync(
  enrichmentId: number,
  params: Record<string, unknown>
): Promise<unknown[]> {
  const taskId = await runEnrichment(enrichmentId, params);
  return pollTask(taskId);
}

// ─── Enrichment ID discovery (cached) ───

let cachedCompanyEnrichmentId: number | null = null;
let cachedPeopleEnrichmentId: number | null = null;

async function findEnrichmentId(query: string): Promise<number | null> {
  try {
    const res = await fetch(
      `${DATABAR_BASE}/enrichments/?q=${encodeURIComponent(query)}`,
      { headers: getDatabarHeaders() }
    );
    if (!res.ok) return null;

    const enrichments = await res.json();
    // Prefer "databar" auth (no extra API key needed), pick first match
    const databarAuth = enrichments.find(
      (e: { auth_method: string }) => e.auth_method === "databar"
    );
    return databarAuth?.id || enrichments[0]?.id || null;
  } catch {
    return null;
  }
}

async function getCompanyEnrichmentId(): Promise<number | null> {
  if (cachedCompanyEnrichmentId) return cachedCompanyEnrichmentId;
  const id = await findEnrichmentId("company enrichment domain");
  if (id) cachedCompanyEnrichmentId = id;
  return id;
}

async function getPeopleEnrichmentId(): Promise<number | null> {
  if (cachedPeopleEnrichmentId) return cachedPeopleEnrichmentId;
  const id = await findEnrichmentId("domain search people email");
  if (id) cachedPeopleEnrichmentId = id;
  return id;
}

// ─── Normalize Databar responses ───

function normalizeCompany(
  raw: Record<string, unknown>,
  domain: string
): CompanyData {
  // Databar normalizes responses but field names vary by provider.
  // Handle common field name patterns.
  return {
    name:
      (raw.company_name as string) ||
      (raw.name as string) ||
      (raw.display_name as string) ||
      domain,
    domain,
    logoUrl: (raw.logo_url as string) || (raw.logo as string) || null,
    industry:
      (raw.industry as string) ||
      (raw.category as string) ||
      (raw.sector as string) ||
      null,
    employeeCount:
      (raw.employee_count as number) ||
      (raw.estimated_num_employees as number) ||
      (raw.size as number) ||
      null,
    revenue:
      (raw.revenue as string) ||
      (raw.annual_revenue as string) ||
      (raw.estimated_annual_revenue as string) ||
      null,
    description:
      (raw.description as string) ||
      (raw.short_description as string) ||
      (raw.summary as string) ||
      null,
    city: (raw.city as string) || (raw.locality as string) || null,
    state: (raw.state as string) || (raw.region as string) || null,
    country: (raw.country as string) || null,
    keywords: (raw.keywords as string[]) || (raw.tags as string[]) || [],
  };
}

function normalizePerson(raw: Record<string, unknown>): PersonData {
  const firstName =
    (raw.first_name as string) || (raw.firstName as string) || "";
  const lastName =
    (raw.last_name as string) || (raw.lastName as string) || "";
  const fullName =
    (raw.name as string) ||
    (raw.full_name as string) ||
    `${firstName} ${lastName}`.trim();

  return {
    name: fullName,
    title:
      (raw.title as string) ||
      (raw.job_title as string) ||
      (raw.headline as string) ||
      null,
    email:
      (raw.email as string) ||
      (raw.work_email as string) ||
      (raw.personal_email as string) ||
      null,
    linkedinUrl:
      (raw.linkedin_url as string) ||
      (raw.linkedinUrl as string) ||
      (raw.linkedin as string) ||
      null,
  };
}

// ─── Apollo fallback ───

interface ApolloOrg {
  name: string;
  logo_url: string | null;
  estimated_num_employees: number | null;
  industry: string | null;
  short_description: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  organization_revenue_printed: string | null;
  keywords: string[] | null;
}

async function enrichCompanyFromApollo(
  domain: string
): Promise<CompanyData | null> {
  const apiKey = process.env.APOLLO_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(
      `https://api.apollo.io/api/v1/organizations/enrich?domain=${encodeURIComponent(domain)}`,
      {
        method: "GET",
        headers: { "Cache-Control": "no-cache", "X-Api-Key": apiKey },
      }
    );

    if (!res.ok) return null;

    const data = await res.json();
    const org = data.organization as ApolloOrg | null;
    if (!org) return null;

    return {
      name: org.name,
      domain,
      logoUrl: org.logo_url,
      industry: org.industry,
      employeeCount: org.estimated_num_employees,
      revenue: org.organization_revenue_printed,
      description: org.short_description,
      city: org.city,
      state: org.state,
      country: org.country,
      keywords: org.keywords || [],
    };
  } catch (e) {
    console.error("Apollo fallback failed:", e);
    return null;
  }
}

// ─── Public API ───

export async function enrichCompany(
  domain: string
): Promise<{ company: CompanyData | null; source: "databar" | "apollo" | "none" }> {
  // Try Databar first
  if (process.env.DATABAR_API_KEY) {
    try {
      const enrichmentId = await getCompanyEnrichmentId();
      if (enrichmentId) {
        const results = await enrichSync(enrichmentId, { domain });
        if (results.length > 0) {
          const company = normalizeCompany(
            results[0] as Record<string, unknown>,
            domain
          );
          if (company.name && company.name !== domain) {
            console.log(`Databar company enrichment: ${company.name} — ${company.industry}`);
            return { company, source: "databar" };
          }
        }
      }
    } catch (e) {
      console.error("Databar company enrichment failed, falling back to Apollo:", e);
    }
  }

  // Fallback to Apollo
  const apolloResult = await enrichCompanyFromApollo(domain);
  if (apolloResult) {
    console.log(`Apollo fallback: ${apolloResult.name} — ${apolloResult.industry}`);
    return { company: apolloResult, source: "apollo" };
  }

  return { company: null, source: "none" };
}

export async function searchPeople(
  domain: string
): Promise<{ people: PersonData[]; source: "databar" | "none" }> {
  // Try Databar people search
  if (process.env.DATABAR_API_KEY) {
    try {
      const enrichmentId = await getPeopleEnrichmentId();
      if (enrichmentId) {
        const results = await enrichSync(enrichmentId, { domain });
        if (results.length > 0) {
          const people = results.map((r) =>
            normalizePerson(r as Record<string, unknown>)
          ).filter((p) => p.name);
          if (people.length > 0) {
            console.log(`Databar people search: found ${people.length} contacts at ${domain}`);
            return { people, source: "databar" };
          }
        }
      }
    } catch (e) {
      console.error("Databar people search failed:", e);
    }
  }

  return { people: [], source: "none" };
}
