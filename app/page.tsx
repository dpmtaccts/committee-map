"use client";

import { useState, useEffect } from "react";
import "./hero-animations.css";
import EraHeader from "@/components/EraHeader";
import HeroAnimation from "@/components/HeroAnimation";
import QuickMapForm from "@/components/QuickMapForm";
import type { QuickMapInputs } from "@/components/QuickMapForm";
import TranscriptForm from "@/components/TranscriptForm";
import type { TranscriptInputs } from "@/components/TranscriptForm";
import LoadingState from "@/components/LoadingState";
import ResultsView from "@/components/ResultsView";
import type { CommitteeResult, DealInputs } from "@/components/ResultsView";
import ConnectedResultsView from "@/components/ConnectedResultsView";
import type { EnrichedResult } from "@/components/ConnectedResultsView";
import { toast } from "sonner";

type Tab = "quick" | "transcript";

const STATS = [
  {
    number: "5x",
    color: "#2A9D8F",
    text: "Multi-threaded deals close at 5x the rate of single-threaded ones.",
    source: "UserGems, 5,000+ opportunities",
  },
  {
    number: "6-10",
    color: "#2A9D8F",
    text: "Decision-makers in the average B2B deal. Enterprise? Up to 20.",
    source: "Gartner",
  },
  {
    number: "40%",
    color: "#C4484E",
    text: "of deals stall because the primary contact leaves or changes roles.",
    source: "Gong",
  },
];

const ENRICH_MESSAGES = [
  "Finding real people...",
  "Mapping your connections...",
  "Building your ways in...",
];

export default function Home() {
  const [tab, setTab] = useState<Tab>("quick");
  const [isLoading, setIsLoading] = useState(false);
  const [inputs, setInputs] = useState<DealInputs | null>(null);
  const [result, setResult] = useState<CommitteeResult | null>(null);
  const [enrichedResult, setEnrichedResult] = useState<EnrichedResult | null>(null);
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichMsgIndex, setEnrichMsgIndex] = useState(0);
  // heroVisible removed — fade-in now handled by CSS @keyframes (hero-animations.css)

  // Cycle enrichment loading messages
  useEffect(() => {
    if (!isEnriching) return;
    const interval = setInterval(() => {
      setEnrichMsgIndex((prev) => (prev + 1) % ENRICH_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [isEnriching]);

  const handleSubmit = async (dealInputs: DealInputs) => {
    setIsLoading(true);
    setInputs(dealInputs);
    setEnrichedResult(null);
    try {
      const res = await fetch("/api/map-committee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dealInputs),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setResult(data as CommitteeResult);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      console.error(e);
      toast.error("Something went wrong. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnrich = async (companyDomain: string) => {
    if (!result || !inputs) return;
    setIsEnriching(true);
    setEnrichMsgIndex(0);
    try {
      const res = await fetch("/api/enrich-committee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyDomain,
          dealInputs: inputs,
          committeeResult: result,
        }),
      });
      const data = await res.json();
      if (data.enrichment_available === false) {
        toast.error("Enrichment unavailable right now. Showing your original map.");
        return;
      }
      setEnrichedResult(data as EnrichedResult);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      console.error(e);
      toast.error("Something went wrong with enrichment. Try again.");
    } finally {
      setIsEnriching(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setInputs(null);
    setEnrichedResult(null);
    setIsLoading(false);
    setIsEnriching(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Enriched results page
  if (enrichedResult && !isEnriching) {
    return (
      <div className="min-h-screen" style={{ background: "#F6F5F2" }}>
        <EraHeader showMapAnother onReset={handleReset} />
        <div className="max-w-[760px] mx-auto px-4 md:px-0 pb-16 pt-[72px]">
          <div className="pt-8">
            <ConnectedResultsView inputs={inputs!} result={enrichedResult} onReset={handleReset} />
          </div>
          <footer className="mt-16 text-center" style={{ borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: 32 }}>
            <span className="font-body" style={{ fontSize: 13, color: "rgba(0,0,0,0.3)" }}>
              Built by{" "}
              <a href="https://eracx.com" target="_blank" rel="noopener noreferrer" style={{ color: "#2A9D8F" }} className="hover:underline">
                Era
              </a>
            </span>
          </footer>
        </div>
      </div>
    );
  }

  // Results page with enrichment prompt
  if (result && !isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <EraHeader showMapAnother onReset={handleReset} />
        <div className="max-w-[720px] mx-auto px-4 md:px-0 pb-16 pt-[72px]">
          <div className="pt-8">
            <ResultsView inputs={inputs!} result={result} onReset={handleReset} />

            {/* Enrichment CTA */}
            {!isEnriching && (
              <EnrichmentPrompt onEnrich={handleEnrich} />
            )}

            {/* Enrichment loading */}
            {isEnriching && (
              <div className="mt-10 rounded-xl p-8 text-center animate-in fade-in duration-300" style={{ background: "#F0EFED" }}>
                <div className="inline-flex items-center gap-1 mb-4">
                  <span className="h-2 w-2 rounded-full animate-pulse-dot" style={{ background: "#2A9D8F" }} />
                  <span className="h-2 w-2 rounded-full animate-pulse-dot [animation-delay:0.2s]" style={{ background: "#2A9D8F" }} />
                  <span className="h-2 w-2 rounded-full animate-pulse-dot [animation-delay:0.4s]" style={{ background: "#2A9D8F" }} />
                </div>
                <p
                  key={enrichMsgIndex}
                  className="font-body animate-in fade-in duration-300"
                  style={{ fontSize: 15, fontWeight: 300, color: "#666" }}
                >
                  {ENRICH_MESSAGES[enrichMsgIndex]}
                </p>
              </div>
            )}
          </div>
          <footer className="mt-16 text-center" style={{ borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: 32 }}>
            <span className="font-body" style={{ fontSize: 13, color: "rgba(0,0,0,0.3)" }}>
              Built by{" "}
              <a href="https://eracx.com" target="_blank" rel="noopener noreferrer" style={{ color: "#2A9D8F" }} className="hover:underline">
                Era
              </a>
            </span>
          </footer>
        </div>
      </div>
    );
  }

  // Loading state on dark background
  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ background: "#0E1013" }}>
        <EraHeader />
        <div className="pt-[72px]">
          <LoadingState />
        </div>
      </div>
    );
  }

  // Input page: dark two-column layout
  return (
    <div className="min-h-screen relative" style={{ background: "#0E1013" }}>
      <HeroAnimation />
      <EraHeader />

      <div
        className="max-w-[1100px] mx-auto px-4 md:px-8 pt-[72px]"
        style={{ position: "relative", zIndex: 1 }}
      >
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 py-12 lg:py-20 items-start">
          {/* LEFT COLUMN — sticky on desktop */}
          <div
            className="lg:sticky lg:top-[72px] flex-shrink-0"
            style={{ flex: "1 1 380px", minWidth: 300 }}
          >
            <div className="hero-fade-in">

              <h1
                className="font-heading"
                style={{ fontSize: 44, fontWeight: 900, color: "#FFFFFF", lineHeight: 1.06, letterSpacing: -1 }}
              >
                Build your<br />relationship map.
              </h1>

              <p
                className="font-body"
                style={{ fontSize: 16, fontWeight: 300, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, marginTop: 16, maxWidth: 390, marginBottom: 44 }}
              >
                We see it all the time.{" "}
                <span style={{ color: "rgba(255,255,255,0.75)", fontWeight: 400 }}>
                  70% of B2B opportunities have only one contact in the CRM.
                </span>{" "}
                One person. One thread. Deals stall or go quiet because you&apos;ve been
                moving things forward with one person, but the team isn&apos;t bought in.
                Know who&apos;s involved in your biggest deals.
              </p>

              <div className="flex flex-col" style={{ gap: 28 }}>
                {STATS.map((stat, i) => (
                  <div
                    key={i}
                    className={`flex items-start hero-stat-fade-in hero-stat-delay-${i}`}
                  >
                    <span
                      className="font-heading flex-shrink-0 text-right"
                      style={{ width: 90, fontSize: 48, fontWeight: 900, color: stat.color, letterSpacing: -2, lineHeight: 1 }}
                    >
                      {stat.number}
                    </span>
                    <div className="ml-4 pt-1">
                      <p className="font-body" style={{ fontSize: 15, fontWeight: 300, color: "rgba(255,255,255,0.55)", lineHeight: 1.45 }}>
                        {stat.text}
                      </p>
                      <p className="font-body" style={{ fontSize: 11, color: "rgba(255,255,255,0.18)", marginTop: 4 }}>
                        {stat.source}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN — white form card */}
          <div className="w-full" style={{ flex: "0 0 auto", maxWidth: 480, minWidth: 360 }}>
            <div
              className="hero-card-fade-in"
              style={{
                background: "#FFFFFF",
                borderRadius: 16,
                padding: "28px 28px 24px",
                boxShadow: "0 8px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)",
              }}
            >
              <div className="flex gap-0 mb-6" style={{ borderBottom: "1.5px solid #E8E7E4" }}>
                <button
                  onClick={() => setTab("quick")}
                  className="font-body cursor-pointer transition-colors"
                  style={{
                    padding: "10px 16px", fontSize: 14, fontWeight: 600,
                    color: tab === "quick" ? "#2A9D8F" : "#999",
                    background: "none", border: "none",
                    borderBottomWidth: 2, borderBottomStyle: "solid",
                    borderBottomColor: tab === "quick" ? "#2A9D8F" : "transparent",
                    marginBottom: -1.5,
                  }}
                >
                  Quick Map
                </button>
                <button
                  onClick={() => setTab("transcript")}
                  className="font-body cursor-pointer transition-colors"
                  style={{
                    padding: "10px 16px", fontSize: 14, fontWeight: 600,
                    color: tab === "transcript" ? "#2A9D8F" : "#999",
                    background: "none", border: "none",
                    borderBottomWidth: 2, borderBottomStyle: "solid",
                    borderBottomColor: tab === "transcript" ? "#2A9D8F" : "transparent",
                    marginBottom: -1.5,
                  }}
                >
                  Drop a Call
                </button>
              </div>

              {tab === "quick" ? (
                <QuickMapForm onSubmit={handleSubmit} isLoading={isLoading} />
              ) : (
                <TranscriptForm onSubmit={handleSubmit} isLoading={isLoading} />
              )}
            </div>

            <p
              className="text-center font-body"
              style={{ fontSize: 12, fontWeight: 400, color: "rgba(255,255,255,0.2)", marginTop: 20 }}
            >
              Free. No login. Takes 60 seconds.
            </p>
          </div>
        </div>
      </div>

      <footer
        className="text-center font-body"
        style={{
          padding: "32px 0", borderTop: "1px solid rgba(255,255,255,0.04)",
          fontSize: 13, fontWeight: 400, color: "rgba(255,255,255,0.15)",
          position: "relative", zIndex: 1,
        }}
      >
        Built by{" "}
        <a href="https://eracx.com" target="_blank" rel="noopener noreferrer" style={{ color: "#2A9D8F" }} className="hover:underline">
          Era
        </a>
      </footer>
    </div>
  );
}

// Enrichment prompt component
function EnrichmentPrompt({ onEnrich }: { onEnrich: (domain: string) => void }) {
  const [domain, setDomain] = useState("");
  const [enrichEmail, setEnrichEmail] = useState("");

  const canSubmit = domain.trim().length > 0 && enrichEmail.trim().includes("@");

  return (
    <div
      className="mt-10 rounded-xl p-6 animate-in fade-in slide-in-from-bottom-2 duration-500"
      style={{
        background: "linear-gradient(135deg, #F8F7F5 0%, #F0EFED 100%)",
        border: "1px solid #E8E7E4",
        animationDelay: "900ms",
        animationFillMode: "both",
      }}
    >
      <h3 className="font-heading" style={{ fontSize: 20, fontWeight: 700, color: "#383838", marginBottom: 4 }}>
        Want to see real people and your ways in?
      </h3>
      <p className="font-body" style={{ fontSize: 14, fontWeight: 300, color: "#888", marginBottom: 16 }}>
        Enter the company domain and we&apos;ll find the actual people in these roles, plus specific ways to reach them.
      </p>

      <div className="space-y-3">
        <input
          type="text"
          placeholder="e.g., meridianhealth.com"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          className="w-full h-11 px-4 rounded-lg font-body text-sm focus:outline-none focus:ring-2"
          style={{ border: "1px solid #D7DADD", color: "#383838", background: "#FFFFFF" }}
        />
        <input
          type="email"
          placeholder="your work email"
          value={enrichEmail}
          onChange={(e) => setEnrichEmail(e.target.value)}
          className="w-full h-11 px-4 rounded-lg font-body text-sm focus:outline-none focus:ring-2"
          style={{ border: "1px solid #D7DADD", color: "#383838", background: "#FFFFFF" }}
        />
        <button
          onClick={() => canSubmit && onEnrich(domain.trim())}
          disabled={!canSubmit}
          className="w-full font-body font-semibold cursor-pointer transition-all duration-150"
          style={{
            height: 48,
            borderRadius: 8,
            fontSize: 14,
            border: "none",
            background: canSubmit ? "#2A9D8F" : "#E8E7E4",
            color: canSubmit ? "#FFFFFF" : "#BCBCBC",
            boxShadow: canSubmit ? "0 4px 20px rgba(42,157,143,0.3)" : "none",
          }}
        >
          Find real people
        </button>
      </div>
    </div>
  );
}
