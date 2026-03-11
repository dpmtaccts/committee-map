"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, ChevronDown, ExternalLink, Building2, Globe } from "lucide-react";
import type { QuickMapInputs } from "@/components/QuickMapForm";
import type { TranscriptInputs } from "@/components/TranscriptForm";

export type DealInputs = QuickMapInputs | TranscriptInputs;

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
  logoUrl: string | null;
  employeeCount: number | null;
  revenue: string | null;
  industry: string | null;
  techStack: string[];
  recentFunding: string | null;
  hqLocation: string | null;
  description: string | null;
}

export interface EnrichedResult {
  enrichment_available: boolean;
  suggested_contacts?: boolean;
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

const ROLE_BORDER_COLORS: Record<string, string> = {
  "Economic Buyer": "#B85C4A",
  "Champion": "#1FA7A2",
  "Technical Evaluator": "#D6B26D",
  "Coach": "#D43D8D",
  "End User": "#5B6670",
  "Blocker": "#B85C4A",
};

const WAY_IN_COLORS: Record<string, string> = {
  mutual: "#7B68A5",
  signal: "#1FA7A2",
  content: "#B85C4A",
  event: "#5B6670",
};

const WAY_IN_LABELS: Record<string, string> = {
  mutual: "Mutual",
  signal: "Signal",
  content: "Content",
  event: "Event",
};

// Risk score ring
function RiskRing({ score, size = 64 }: { score: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = ((100 - score) / 100) * circumference;
  const color = score > 70 ? "#C4484E" : score > 40 ? "#B85C4A" : "#1FA7A2";

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#D7DADD" strokeWidth={4} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={4}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - filled}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
      </svg>
      <span className="absolute font-heading" style={{ fontSize: size > 50 ? 18 : 13, fontWeight: 900, color }}>
        {score}
      </span>
    </div>
  );
}

// Expandable role card
function RoleCard({ role, defaultOpen }: { role: EnrichedRole; defaultOpen?: boolean }) {
  const [expanded, setExpanded] = useState(defaultOpen || false);

  const borderColor = ROLE_BORDER_COLORS[role.role] || "#5B6670";
  const statusConfig = {
    covered: { label: "Covered", color: "#1FA7A2", bg: "rgba(31,167,162,0.1)" },
    gap: { label: "Gap", color: "#B85C4A", bg: "rgba(184,92,74,0.1)" },
    risk: { label: "Risk", color: "#C4484E", bg: "rgba(196,72,78,0.1)" },
  };
  const config = statusConfig[role.status];

  return (
    <div
      className="rounded-xl overflow-hidden cursor-pointer transition-shadow duration-200"
      style={{
        background: "#FFFFFF",
        border: "1px solid #D7DADD",
        borderLeft: `4px solid ${borderColor}`,
        boxShadow: expanded ? "0 4px 20px rgba(0,0,0,0.08)" : "0 1px 3px rgba(0,0,0,0.04)",
      }}
      onClick={() => setExpanded(!expanded)}
    >
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
                    className="flex items-center gap-1 hover:underline"
                    style={{ color: "#1FA7A2", fontSize: 13 }}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span className="font-body">LinkedIn</span>
                  </a>
                )}
              </div>
            ) : (
              <p className="font-body mt-1" style={{ fontSize: 15, fontWeight: 600, color: "#D7DADD", fontStyle: "italic" }}>
                Unidentified
              </p>
            )}
            <p className="font-body" style={{ fontSize: 14, color: "#5B6670", marginTop: 2 }}>
              {role.title || role.likely_title}
            </p>
          </div>
          <ChevronDown
            className="w-4 h-4 transition-transform duration-200 flex-shrink-0 mt-1"
            style={{ color: "#5B6670", transform: expanded ? "rotate(180deg)" : "rotate(0)" }}
          />
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
        <div className="px-5 pb-5 space-y-4" style={{ borderTop: "1px solid #F6F5F2" }}>
          <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="font-body uppercase" style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: "#5B6670" }}>
                What they care about
              </span>
              <p className="font-body mt-1" style={{ fontSize: 14, fontWeight: 300, color: "#383838", lineHeight: 1.5 }}>
                {role.what_they_care_about}
              </p>
            </div>
            <div>
              <span className="font-body uppercase" style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: "#5B6670" }}>
                How they evaluate
              </span>
              <p className="font-body mt-1" style={{ fontSize: 14, fontWeight: 300, color: "#383838", lineHeight: 1.5 }}>
                {role.how_they_evaluate}
              </p>
            </div>
          </div>

          {role.waysIn && role.waysIn.length > 0 && (
            <div>
              <span className="font-body uppercase" style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: "#5B6670" }}>
                Ways in
              </span>
              <div className="mt-2 space-y-2">
                {role.waysIn.map((way, i) => (
                  <div
                    key={i}
                    className="rounded-lg p-3 flex items-start gap-3"
                    style={{
                      background: "#F6F5F2",
                      borderLeft: `3px solid ${WAY_IN_COLORS[way.type] || "#5B6670"}`,
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
                          color: WAY_IN_COLORS[way.type] || "#5B6670",
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
        </div>
      </div>
    </div>
  );
}

const ConnectedResultsView = ({ inputs, result, onReset }: ConnectedResultsViewProps) => {
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleEmailSubmit = async () => {
    if (!email.trim() || sending) return;
    setSending(true);
    try {
      const companyDomain = result.company?.domain || "";
      const roleContext = inputs.path === "quick_map" ? (inputs.roleContext || inputs.linkedinUrl || "") : "";
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          companyDomain,
          roleContext,
          enriched: result.enrichment_available,
          results: result,
        }),
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
        style={{ background: "#FFFFFF", border: "1px solid #D7DADD" }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div
              className="flex items-center justify-center rounded-lg flex-shrink-0 overflow-hidden"
              style={{ width: 48, height: 48, background: "#F6F5F2" }}
            >
              {company.logoUrl ? (
                <img
                  src={company.logoUrl}
                  alt={company.name}
                  width={48}
                  height={48}
                  className="object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    const parent = e.currentTarget.parentElement;
                    if (parent) parent.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5B6670" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>';
                  }}
                />
              ) : (
                <Building2 className="w-5 h-5" style={{ color: "#5B6670" }} />
              )}
            </div>
            <div>
              <h2 className="font-heading" style={{ fontSize: 22, fontWeight: 900, color: "#383838" }}>
                {company.name}
              </h2>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                {company.domain && (
                  <span className="font-body flex items-center gap-1" style={{ fontSize: 13, color: "#1FA7A2" }}>
                    <Globe className="w-3 h-3" />
                    {company.domain}
                  </span>
                )}
                {company.industry && (
                  <span className="font-body" style={{ fontSize: 13, color: "#5B6670" }}>{company.industry}</span>
                )}
                {company.employeeCount && (
                  <span className="font-body" style={{ fontSize: 13, color: "#5B6670" }}>
                    ~{company.employeeCount.toLocaleString()} employees
                  </span>
                )}
                {company.revenue && (
                  <span className="font-body" style={{ fontSize: 13, color: "#5B6670" }}>{company.revenue} revenue</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <RiskRing score={result.deal_risk_score} />
            <span className="font-body" style={{ fontSize: 10, fontWeight: 600, color: "#5B6670", letterSpacing: "0.05em" }}>
              DEAL RISK
            </span>
          </div>
        </div>
      </div>

      {/* Role Cards */}
      {result.suggested_contacts && (
        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: "120ms", animationFillMode: "both" }}>
          <span className="font-body uppercase" style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "#B85C4A" }}>
            Suggested contacts
          </span>
          <span className="font-body" style={{ fontSize: 12, color: "#5B6670" }}>
            &mdash; based on company size &amp; structure. Verify on LinkedIn.
          </span>
        </div>
      )}
      <div className="space-y-3">
        {result.roles.map((role, i) => (
          <div
            key={i}
            className="animate-in fade-in slide-in-from-bottom-2 duration-300"
            style={{ animationDelay: `${150 + i * 80}ms`, animationFillMode: "both" }}
          >
            <RoleCard role={role} defaultOpen={i === 0} />
          </div>
        ))}
      </div>

      {/* Biggest Gap - oxide styled */}
      <div
        className="rounded-lg p-6 animate-in fade-in slide-in-from-bottom-2 duration-300"
        style={{
          background: "rgba(184,92,74,0.05)",
          borderLeft: "3px solid #B85C4A",
          animationDelay: "500ms",
          animationFillMode: "both",
        }}
      >
        <h3 className="font-heading" style={{ fontSize: 18, fontWeight: 700, color: "#B85C4A", marginBottom: 8 }}>
          Your biggest relationship gap
        </h3>
        <p className="font-body" style={{ fontSize: 15, fontWeight: 300, color: "#383838", lineHeight: 1.6 }}>
          {result.biggest_risk}
        </p>
      </div>

      {/* Next Moves - teal numbers */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: "600ms", animationFillMode: "both" }}>
        <h3 className="font-heading" style={{ fontSize: 20, fontWeight: 700, color: "#383838", marginBottom: 16 }}>
          Your next three moves
        </h3>
        <div className="space-y-3">
          {result.next_moves.map((move, i) => (
            <div
              key={i}
              className="rounded-lg p-4 flex gap-3"
              style={{ background: "#FFFFFF", border: "1px solid #D7DADD" }}
            >
              <span className="flex-shrink-0 font-body" style={{ fontSize: 24, fontWeight: 700, color: "#1FA7A2" }}>
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
        <p className="font-body" style={{ fontSize: 15, fontWeight: 300, color: "#5B6670", lineHeight: 1.6 }}>
          {result.pattern}
        </p>
      </div>

      {/* Email Capture */}
      <div
        className="rounded-xl p-6 text-center animate-in fade-in slide-in-from-bottom-2 duration-300"
        style={{ background: "#FFFFFF", border: "1px solid #D7DADD", animationDelay: "800ms", animationFillMode: "both" }}
      >
        {emailSent ? (
          <div className="flex items-center justify-center gap-2 animate-in fade-in duration-200" style={{ color: "#1FA7A2" }}>
            <Check className="w-5 h-5" />
            <span className="font-semibold font-body">Sent. Check your inbox.</span>
          </div>
        ) : (
          <>
            <h3 className="font-heading" style={{ fontSize: 18, fontWeight: 700, color: "#383838", marginBottom: 4 }}>
              Send this map to your inbox
            </h3>
            <p className="font-body" style={{ fontSize: 13, fontWeight: 300, color: "#5B6670", marginBottom: 16 }}>
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
                className="h-11 px-6 rounded-lg font-body font-semibold transition-all cursor-pointer"
                style={{
                  fontSize: 14,
                  background: email.trim() && !sending ? "#383838" : "#D7DADD",
                  color: email.trim() && !sending ? "#FFFFFF" : "#5B6670",
                  border: "none",
                }}
              >
                {sending ? "Sending..." : "Send"}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Map Another */}
      <button
        onClick={onReset}
        className="w-full h-12 rounded-lg font-body font-semibold cursor-pointer transition-all"
        style={{
          fontSize: 14,
          background: "transparent",
          color: "#383838",
          border: "1px solid #D7DADD",
        }}
      >
        Map another deal
      </button>
    </div>
  );
};

export default ConnectedResultsView;
