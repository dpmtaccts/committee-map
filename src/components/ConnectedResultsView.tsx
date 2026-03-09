"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check, Share2, Download, ChevronDown, ExternalLink, Building2 } from "lucide-react";
import type { DealInputs } from "@/components/ResultsView";

interface WayIn {
  type: "mutual" | "signal" | "content" | "event";
  icon: string;
  text: string;
}

interface EnrichedRole {
  role: string;
  likely_title: string;
  title: string;
  name: string | null;
  linkedinUrl: string | null;
  email: string | null;
  warmth: number;
  what_they_care_about: string;
  how_they_evaluate: string;
  status: "covered" | "gap" | "risk";
  waysIn: WayIn[];
}

interface CompanyInfo {
  name: string;
  domain: string;
  employeeCount: number | null;
  revenue: string | null;
  industry: string | null;
  techStack: string[];
  recentFunding: string | null;
  hqLocation: string | null;
}

export interface EnrichedResult {
  enrichment_available: boolean;
  company: CompanyInfo;
  roles: EnrichedRole[];
  deal_risk_score: number;
  competitive_signals: string[] | null;
  biggest_risk: string;
  next_moves: string[];
  pattern: string;
}

interface ConnectedResultsViewProps {
  inputs: DealInputs;
  result: EnrichedResult;
  onReset: () => void;
}

const WAY_IN_COLORS: Record<string, string> = {
  mutual: "#7B68A5",
  signal: "#2A9D8F",
  content: "#C4713B",
  event: "#8B8B8B",
};

const WAY_IN_LABELS: Record<string, string> = {
  mutual: "Mutual",
  signal: "Signal",
  content: "Content",
  event: "Event",
};

// Risk score ring SVG
function RiskRing({ score, size = 64 }: { score: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = ((100 - score) / 100) * circumference; // invert: lower risk = more fill
  const color = score > 70 ? "#C4484E" : score > 40 ? "#C4713B" : "#2A9D8F";

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#E8E7E4" strokeWidth={4} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={4}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - filled}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
      </svg>
      <span
        className="absolute font-heading"
        style={{ fontSize: size > 50 ? 18 : 13, fontWeight: 900, color }}
      >
        {score}
      </span>
    </div>
  );
}

// Warmth indicator
function WarmthBar({ warmth }: { warmth: number }) {
  const color = warmth > 60 ? "#2A9D8F" : warmth > 30 ? "#C4713B" : "#C4484E";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full" style={{ background: "#E8E7E4" }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${warmth}%`, background: color, transition: "width 0.8s ease-out" }}
        />
      </div>
      <span className="font-body" style={{ fontSize: 11, color: "#999", minWidth: 28 }}>
        {warmth}%
      </span>
    </div>
  );
}

// Expandable connected role card
function ConnectedRoleCard({ role }: { role: EnrichedRole }) {
  const [expanded, setExpanded] = useState(false);

  const statusConfig = {
    covered: { label: "Covered", color: "#2A9D8F", bg: "rgba(42,157,143,0.1)" },
    gap: { label: "Gap", color: "#C4713B", bg: "rgba(196,113,59,0.1)" },
    risk: { label: "Risk", color: "#C4484E", bg: "rgba(196,72,78,0.1)" },
  };
  const config = statusConfig[role.status];

  return (
    <div
      className="rounded-xl overflow-hidden cursor-pointer transition-shadow duration-200"
      style={{
        background: "#FFFFFF",
        border: "1px solid #E8E7E4",
        borderLeft: `4px solid ${config.color}`,
        boxShadow: expanded ? "0 4px 20px rgba(0,0,0,0.08)" : "0 1px 3px rgba(0,0,0,0.04)",
      }}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Header — always visible */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-1">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg font-heading" style={{ color: "#383838" }}>
                {role.role}
              </h3>
              <span
                className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                style={{ background: config.bg, color: config.color }}
              >
                {config.label}
              </span>
            </div>
            {role.name ? (
              <div className="flex items-center gap-2 mt-1">
                <p className="font-body" style={{ fontSize: 15, fontWeight: 600, color: "#383838" }}>
                  {role.name}
                </p>
                {role.linkedinUrl && (
                  <a
                    href={role.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{ color: "#2A9D8F" }}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            ) : null}
            <p className="font-body" style={{ fontSize: 14, color: "#888", marginTop: 2 }}>
              {role.title || role.likely_title}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {role.name && <WarmthBar warmth={role.warmth} />}
            <ChevronDown
              className="w-4 h-4 transition-transform duration-200 flex-shrink-0"
              style={{ color: "#999", transform: expanded ? "rotate(180deg)" : "rotate(0)" }}
            />
          </div>
        </div>
      </div>

      {/* Expanded content */}
      <div
        style={{
          maxHeight: expanded ? 600 : 0,
          opacity: expanded ? 1 : 0,
          overflow: "hidden",
          transition: "max-height 0.3s ease-out, opacity 0.2s ease-out",
        }}
      >
        <div className="px-5 pb-5 space-y-4" style={{ borderTop: "1px solid #F0EFED" }}>
          <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="font-body uppercase" style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: "#999" }}>
                What they care about
              </span>
              <p className="font-body mt-1" style={{ fontSize: 14, fontWeight: 300, color: "#383838", lineHeight: 1.5 }}>
                {role.what_they_care_about}
              </p>
            </div>
            <div>
              <span className="font-body uppercase" style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: "#999" }}>
                How they evaluate
              </span>
              <p className="font-body mt-1" style={{ fontSize: 14, fontWeight: 300, color: "#383838", lineHeight: 1.5 }}>
                {role.how_they_evaluate}
              </p>
            </div>
          </div>

          {/* Ways In */}
          {role.waysIn && role.waysIn.length > 0 && (
            <div>
              <span className="font-body uppercase" style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: "#999" }}>
                Ways in
              </span>
              <div className="mt-2 space-y-2">
                {role.waysIn.map((way, i) => (
                  <div
                    key={i}
                    className="rounded-lg p-3 flex items-start gap-3"
                    style={{
                      background: "#FAFAF9",
                      borderLeft: `3px solid ${WAY_IN_COLORS[way.type] || "#999"}`,
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{way.icon}</span>
                    <div className="flex-1">
                      <span
                        className="font-body uppercase"
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          letterSpacing: "0.1em",
                          color: WAY_IN_COLORS[way.type] || "#999",
                        }}
                      >
                        {WAY_IN_LABELS[way.type] || way.type}
                      </span>
                      <p className="font-body mt-0.5" style={{ fontSize: 13, fontWeight: 300, color: "#383838", lineHeight: 1.5 }}>
                        {way.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Email if available */}
          {role.email && (
            <p className="font-body" style={{ fontSize: 12, color: "#999" }}>
              {role.email}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

const ConnectedResultsView = ({ inputs, result, onReset }: ConnectedResultsViewProps) => {
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPdf = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const res = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrichedResult: result, inputs }),
      });
      if (!res.ok) throw new Error("PDF generation failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relationship-map-${result.company.name.toLowerCase().replace(/\s+/g, "-")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to generate PDF. Try again.");
    } finally {
      setDownloading(false);
    }
  };

  const summaryLine =
    inputs.path === "quick_map"
      ? `${inputs.productType} → ${inputs.industry} → ${inputs.dealSize} deal → ${inputs.dealStage}`
      : "Based on your discovery call transcript";

  const handleEmailSubmit = async () => {
    if (!email.trim() || sending) return;
    setSending(true);
    try {
      const insertData: Record<string, unknown> = {
        email: email.trim(),
        input_path: inputs.path,
        results: result,
      };
      if (inputs.path === "quick_map") {
        insertData.product_type = inputs.productType;
        insertData.industry = inputs.industry;
        insertData.buying_department = inputs.buyingDepartment;
        insertData.company_size = inputs.companySize;
        insertData.deal_size = inputs.dealSize;
        insertData.deal_stage = inputs.dealStage;
        insertData.contact_level = inputs.contactLevel;
      }
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(insertData),
      });
      if (!res.ok) throw new Error("Submit failed");
      setEmailSent(true);
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setSending(false);
    }
  };

  const { company } = result;

  return (
    <div className="space-y-8">
      {/* Company Header Card */}
      <div
        className="rounded-xl p-6 animate-in fade-in slide-in-from-bottom-2 duration-300"
        style={{ background: "#FFFFFF", border: "1px solid #E8E7E4", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div
              className="flex items-center justify-center rounded-lg flex-shrink-0"
              style={{ width: 48, height: 48, background: "#F0EFED" }}
            >
              <Building2 className="w-5 h-5" style={{ color: "#999" }} />
            </div>
            <div>
              <h2 className="font-heading" style={{ fontSize: 22, fontWeight: 900, color: "#383838" }}>
                {company.name}
              </h2>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                {company.industry && (
                  <span className="font-body" style={{ fontSize: 13, color: "#888" }}>
                    {company.industry}
                  </span>
                )}
                {company.employeeCount && (
                  <span className="font-body" style={{ fontSize: 13, color: "#888" }}>
                    {company.employeeCount.toLocaleString()} employees
                  </span>
                )}
                {company.hqLocation && (
                  <span className="font-body" style={{ fontSize: 13, color: "#888" }}>
                    {company.hqLocation}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <RiskRing score={result.deal_risk_score} />
            <span className="font-body" style={{ fontSize: 10, fontWeight: 600, color: "#999", letterSpacing: "0.05em" }}>
              DEAL RISK
            </span>
          </div>
        </div>

        {/* Summary line */}
        <p className="font-body mt-3" style={{ fontSize: 13, color: "#999" }}>
          {summaryLine}
        </p>

        {/* Tech stack / funding */}
        <div className="flex flex-wrap gap-2 mt-3">
          {company.techStack?.slice(0, 6).map((tech, i) => (
            <span
              key={i}
              className="font-body rounded-full"
              style={{ fontSize: 11, padding: "3px 10px", background: "#F0EFED", color: "#666" }}
            >
              {tech}
            </span>
          ))}
          {company.recentFunding && (
            <span
              className="font-body rounded-full"
              style={{ fontSize: 11, padding: "3px 10px", background: "rgba(42,157,143,0.08)", color: "#2A9D8F" }}
            >
              {company.recentFunding}
            </span>
          )}
        </div>
      </div>

      {/* Competitive Signals */}
      {result.competitive_signals && result.competitive_signals.length > 0 && (
        <div
          className="rounded-lg p-4 animate-in fade-in slide-in-from-bottom-2 duration-300"
          style={{ background: "rgba(196,72,78,0.05)", border: "1px solid rgba(196,72,78,0.12)", animationDelay: "100ms", animationFillMode: "both" }}
        >
          <span className="font-body uppercase" style={{ fontSize: 10, fontWeight: 700, color: "#C4484E", letterSpacing: "0.08em" }}>
            Competitive Signals
          </span>
          <ul className="mt-2 space-y-1">
            {result.competitive_signals.map((sig, i) => (
              <li key={i} className="font-body" style={{ fontSize: 13, color: "#666", lineHeight: 1.5 }}>
                {sig}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Role Cards */}
      <div className="space-y-3">
        {result.roles.map((role, i) => (
          <div
            key={i}
            className="animate-in fade-in slide-in-from-bottom-2 duration-300"
            style={{ animationDelay: `${150 + i * 80}ms`, animationFillMode: "both" }}
          >
            <ConnectedRoleCard role={role} />
          </div>
        ))}
      </div>

      {/* Biggest Risk — regenerated */}
      <div
        className="rounded-lg p-6 animate-in fade-in slide-in-from-bottom-2 duration-300"
        style={{ background: "#F0EFED", animationDelay: "500ms", animationFillMode: "both" }}
      >
        <h3 className="font-heading" style={{ fontSize: 18, fontWeight: 700, color: "#C4484E", marginBottom: 8 }}>
          Your biggest relationship gap
        </h3>
        <p className="font-body" style={{ fontSize: 15, fontWeight: 300, color: "#383838", lineHeight: 1.6 }}>
          {result.biggest_risk}
        </p>
      </div>

      {/* Next Moves — regenerated */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: "600ms", animationFillMode: "both" }}>
        <h3 className="font-heading" style={{ fontSize: 20, fontWeight: 700, color: "#383838", marginBottom: 16 }}>
          Your next three moves
        </h3>
        <div className="space-y-3">
          {result.next_moves.map((move, i) => (
            <div
              key={i}
              className="rounded-lg p-4 flex gap-3"
              style={{ background: "#FFFFFF", border: "1px solid #E8E7E4" }}
            >
              <span className="flex-shrink-0 font-body" style={{ fontSize: 24, fontWeight: 700, color: "#2A9D8F" }}>
                {i + 1}.
              </span>
              <p className="font-body pt-1" style={{ fontSize: 15, fontWeight: 300, color: "#383838", lineHeight: 1.5 }}>
                {move}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Pattern */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: "700ms", animationFillMode: "both" }}>
        <h3 className="font-heading" style={{ fontSize: 20, fontWeight: 700, color: "#383838", marginBottom: 8 }}>
          The pattern to watch
        </h3>
        <p className="font-body" style={{ fontSize: 15, fontWeight: 300, color: "#888", lineHeight: 1.6 }}>
          {result.pattern}
        </p>
      </div>

      {/* Email Capture */}
      <div
        className="rounded-xl p-6 text-center animate-in fade-in slide-in-from-bottom-2 duration-300"
        style={{ background: "#FFFFFF", border: "1px solid #E8E7E4", animationDelay: "800ms", animationFillMode: "both" }}
      >
        {emailSent ? (
          <div className="flex items-center justify-center gap-2 animate-in fade-in duration-200" style={{ color: "#2A9D8F" }}>
            <Check className="w-5 h-5" />
            <span className="font-semibold font-body">Sent. Check your inbox.</span>
          </div>
        ) : (
          <>
            <h3 className="font-heading" style={{ fontSize: 18, fontWeight: 700, color: "#383838", marginBottom: 4 }}>
              Send this map to your inbox
            </h3>
            <p className="font-body" style={{ fontSize: 13, fontWeight: 300, color: "#888", marginBottom: 16 }}>
              A clean copy, nothing else. No spam, no sequence.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 h-11 px-4 rounded-lg font-body text-base focus:outline-none focus:ring-2"
                style={{ border: "1px solid #D7DADD", color: "#383838", background: "#FFFFFF" }}
              />
              <button
                onClick={handleEmailSubmit}
                disabled={!email.trim() || sending}
                className="h-11 px-6 rounded-lg font-body font-semibold transition-all"
                style={{
                  fontSize: 14,
                  background: email.trim() && !sending ? "#2A9D8F" : "#E8E7E4",
                  color: email.trim() && !sending ? "#FFFFFF" : "#BCBCBC",
                  border: "none",
                  cursor: email.trim() && !sending ? "pointer" : "default",
                }}
              >
                {sending ? "Sending..." : "Send"}
              </button>
            </div>
          </>
        )}
      </div>

      {/* PDF + Share + Map Another */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="ghost"
          size="lg"
          className="flex-1"
          onClick={handleDownloadPdf}
          disabled={downloading}
        >
          <Download className="w-4 h-4 mr-1.5" />
          {downloading ? "Generating..." : "PDF"}
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="flex-1"
          onClick={() => {
            if (navigator.share) {
              navigator.share({ title: "My Relationship Map", url: window.location.href });
            } else {
              navigator.clipboard.writeText(window.location.href);
              toast.success("Link copied to clipboard");
            }
          }}
        >
          <Share2 className="w-4 h-4 mr-1.5" />
          Share this
        </Button>
        <Button variant="outline" size="lg" className="flex-1" onClick={onReset}>
          Map another deal
        </Button>
      </div>
    </div>
  );
};

export default ConnectedResultsView;
