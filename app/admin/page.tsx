import { cookies } from "next/headers";
import { createHash } from "crypto";
import { Pool } from "pg";
import LoginForm from "./login-form";
import SubmissionsTable from "./submissions-table";

function makeToken(password: string) {
  return createHash("sha256").update(`era-admin:${password}`).digest("hex").slice(0, 32);
}

function isAuthenticated() {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return false;
  const cookieStore = cookies();
  const session = cookieStore.get("admin_session")?.value;
  return session === makeToken(adminPassword);
}

interface SubmissionRow {
  id: string;
  email: string;
  input_path: string;
  product_type: string | null;
  industry: string | null;
  deal_size: string | null;
  results: Record<string, unknown>;
  created_at: string;
}

async function getStats(pool: Pool) {
  const [totalRes, weekRes, enrichedRes, companiesRes] = await Promise.all([
    pool.query("SELECT COUNT(*) as count FROM submissions"),
    pool.query("SELECT COUNT(*) as count FROM submissions WHERE created_at > NOW() - INTERVAL '7 days'"),
    pool.query("SELECT COUNT(*) as count FROM submissions WHERE results->>'enrichment_available' = 'true' OR results->'company' IS NOT NULL"),
    pool.query("SELECT COUNT(DISTINCT results->>'company') as count FROM submissions WHERE results->'company' IS NOT NULL"),
  ]);

  return {
    total: parseInt(totalRes.rows[0].count),
    thisWeek: parseInt(weekRes.rows[0].count),
    enriched: parseInt(enrichedRes.rows[0].count),
    uniqueCompanies: parseInt(companiesRes.rows[0].count),
  };
}

async function getSubmissions(pool: Pool): Promise<SubmissionRow[]> {
  const res = await pool.query(
    "SELECT id, email, input_path, product_type, industry, deal_size, results, created_at FROM submissions ORDER BY created_at DESC LIMIT 200"
  );
  return res.rows;
}

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!isAuthenticated()) {
    return <LoginForm />;
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  let stats = { total: 0, thisWeek: 0, enriched: 0, uniqueCompanies: 0 };
  let submissions: SubmissionRow[] = [];

  try {
    [stats, submissions] = await Promise.all([getStats(pool), getSubmissions(pool)]);
  } catch (e) {
    console.error("Admin DB error:", e);
  } finally {
    await pool.end();
  }

  const statCards = [
    { label: "Total Submissions", value: stats.total },
    { label: "This Week", value: stats.thisWeek },
    { label: "Enriched", value: stats.enriched },
    { label: "Unique Companies", value: stats.uniqueCompanies },
  ];

  return (
    <div className="min-h-screen font-body" style={{ background: "#F6F5F2" }}>
      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #E8E7E4", padding: "16px 32px" }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-heading" style={{ fontSize: 20, fontWeight: 900, color: "#383838" }}>
              era<span style={{ color: "#2A9D8F" }}>.</span>
            </span>
            <span style={{ color: "#D7DADD" }}>|</span>
            <span className="font-body text-sm" style={{ color: "#888" }}>Admin</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {statCards.map((s) => (
            <div key={s.label} className="rounded-lg p-5" style={{ background: "#fff", border: "1px solid #E8E7E4" }}>
              <p className="text-sm font-body" style={{ color: "#888" }}>{s.label}</p>
              <p className="font-heading text-2xl font-bold mt-1" style={{ color: "#383838" }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-lg overflow-hidden" style={{ background: "#fff", border: "1px solid #E8E7E4" }}>
          <div className="px-5 py-4" style={{ borderBottom: "1px solid #E8E7E4" }}>
            <h2 className="font-heading font-bold" style={{ fontSize: 16, color: "#383838" }}>Submissions</h2>
          </div>
          <SubmissionsTable submissions={JSON.parse(JSON.stringify(submissions))} />
        </div>
      </div>
    </div>
  );
}
