"use client";

import { useState } from "react";

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

export default function SubmissionsTable({ submissions }: { submissions: SubmissionRow[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const isEnriched = (row: SubmissionRow) =>
    row.results?.company != null || (row.results as Record<string, unknown>)?.enrichment_available === true;

  const getCompanyDomain = (row: SubmissionRow) => {
    const company = row.results?.company as Record<string, unknown> | undefined;
    return company?.domain as string || null;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm font-body" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#FAFAF9", borderBottom: "1px solid #E8E7E4" }}>
            {["Date", "Email", "Path", "Company", "Deal Size", "Industry", "Enriched", ""].map((h) => (
              <th
                key={h}
                className="text-left px-4 py-3 font-semibold"
                style={{ color: "#5B6670", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {submissions.map((row) => (
            <>
              <tr key={row.id} style={{ borderBottom: "1px solid #F0EFED" }}>
                <td className="px-4 py-3" style={{ color: "#888", whiteSpace: "nowrap" }}>
                  {new Date(row.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </td>
                <td className="px-4 py-3" style={{ color: "#383838" }}>{row.email}</td>
                <td className="px-4 py-3" style={{ color: "#888" }}>
                  {row.input_path === "quick_map" ? "Quick Map" : "Transcript"}
                </td>
                <td className="px-4 py-3" style={{ color: "#888" }}>
                  {getCompanyDomain(row) || "\u2014"}
                </td>
                <td className="px-4 py-3" style={{ color: "#888" }}>{row.deal_size || "\u2014"}</td>
                <td className="px-4 py-3" style={{ color: "#888" }}>{row.industry || "\u2014"}</td>
                <td className="px-4 py-3">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full"
                    style={{ background: isEnriched(row) ? "#2A9D8F" : "#C4484E" }}
                  />
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}
                    className="text-xs font-semibold font-body hover:underline"
                    style={{ color: "#2A9D8F", background: "none", border: "none", cursor: "pointer" }}
                  >
                    {expandedId === row.id ? "Hide" : "View JSON"}
                  </button>
                </td>
              </tr>
              {expandedId === row.id && (
                <tr key={`${row.id}-json`}>
                  <td colSpan={8} className="px-4 py-4" style={{ background: "#FAFAF9" }}>
                    <pre
                      className="font-mono text-xs overflow-x-auto rounded-lg p-4"
                      style={{ background: "#fff", border: "1px solid #E8E7E4", color: "#383838", maxHeight: 400, overflowY: "auto" }}
                    >
                      {JSON.stringify(row.results, null, 2)}
                    </pre>
                  </td>
                </tr>
              )}
            </>
          ))}
          {submissions.length === 0 && (
            <tr>
              <td colSpan={8} className="px-4 py-8 text-center" style={{ color: "#888" }}>
                No submissions yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
