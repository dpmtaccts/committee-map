"use client";

import { useState } from "react";
import RoleCard from "@/components/RoleCard";
import type { Role } from "@/components/RoleCard";
import type { QuickMapInputs } from "@/components/QuickMapForm";
import type { TranscriptInputs } from "@/components/TranscriptForm";
import { toast } from "sonner";
import { Check } from "lucide-react";

export interface CommitteeResult {
  roles: Role[];
  biggest_risk: string;
  next_moves: string[];
  pattern: string;
  deal_summary?: string;
}

export type DealInputs = QuickMapInputs | TranscriptInputs;

interface ResultsViewProps {
  inputs: DealInputs;
  result: CommitteeResult;
  onReset: () => void;
}

const ResultsView = ({ inputs, result, onReset }: ResultsViewProps) => {
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [sending, setSending] = useState(false);

  const summaryLine =
    inputs.path === "quick_map"
      ? `${inputs.companyDomain || "Company"} relationship map`
      : result.deal_summary || "Based on your discovery call transcript";

  const handleEmailSubmit = async () => {
    if (!email.trim() || sending) return;
    setSending(true);
    try {
      const companyDomain = inputs.path === "quick_map" ? inputs.companyDomain : "";
      const roleContext = inputs.path === "quick_map" ? (inputs.roleContext || "") : "";
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          companyDomain,
          roleContext,
          enriched: false,
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

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        <h2 className="font-heading" style={{ fontSize: 32, fontWeight: 900, color: "#383838", marginBottom: 4 }}>
          Your Relationship Map
        </h2>
        <p className="font-body" style={{ fontSize: 14, color: "#5B6670" }}>{summaryLine}</p>
      </div>

      {/* Role Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {result.roles.map((role, i) => (
          <div
            key={i}
            className="animate-in fade-in slide-in-from-bottom-2 duration-300"
            style={{ animationDelay: `${i * 100}ms`, animationFillMode: "both" }}
          >
            <RoleCard role={role} />
          </div>
        ))}
      </div>

      {/* Biggest Risk */}
      <div
        className="rounded-lg p-6 animate-in fade-in slide-in-from-bottom-2 duration-300"
        style={{
          background: "rgba(184,92,74,0.05)",
          borderLeft: "3px solid #B85C4A",
          animationDelay: "400ms",
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

      {/* Next Moves */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: "500ms", animationFillMode: "both" }}>
        <h3 className="font-heading" style={{ fontSize: 20, fontWeight: 700, color: "#383838", marginBottom: 16 }}>
          Your next three moves
        </h3>
        <div className="space-y-3">
          {result.next_moves.map((move, i) => (
            <div key={i} className="rounded-lg p-4 flex gap-3" style={{ background: "#FFFFFF", border: "1px solid #D7DADD" }}>
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
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: "600ms", animationFillMode: "both" }}>
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
        style={{ background: "#FFFFFF", border: "1px solid #D7DADD", animationDelay: "700ms", animationFillMode: "both" }}
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

export default ResultsView;
