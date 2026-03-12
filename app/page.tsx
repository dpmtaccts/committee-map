"use client";

import { useState } from "react";
import QuickMapForm from "@/components/QuickMapForm";
import type { QuickMapInputs } from "@/components/QuickMapForm";
import TranscriptForm from "@/components/TranscriptForm";
import type { TranscriptInputs } from "@/components/TranscriptForm";
import ConnectedResultsView from "@/components/ConnectedResultsView";
import type { EnrichedResult } from "@/components/ConnectedResultsView";
import EraHeader from "@/components/EraHeader";
import { toast } from "sonner";

export type DealInputs = QuickMapInputs | TranscriptInputs;

const STATS = [
  {
    number: "5x",
    text: "Multi-threaded deals close at 5x the rate of single-threaded ones.",
    source: "UserGems",
  },
  {
    number: "6-10",
    text: "Decision makers in the average B2B deal. Enterprise? Up to 20.",
    source: "Gartner",
  },
  {
    number: "40%",
    text: "of deals stall because the primary contact leaves or changes roles.",
    source: "Gong",
  },
];

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingDomain, setLoadingDomain] = useState("");
  const [inputs, setInputs] = useState<DealInputs | null>(null);
  const [enrichedResult, setEnrichedResult] = useState<EnrichedResult | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);

  const handleSubmit = async (dealInputs: DealInputs) => {
    setIsLoading(true);
    setInputs(dealInputs);
    setEnrichedResult(null);

    if (dealInputs.path === "quick_map") {
      setLoadingDomain(dealInputs.companyDomain);
    }

    try {
      if (dealInputs.path === "quick_map") {
        // New flow: combined generate-map route
        const res = await fetch("/api/generate-map", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dealInputs),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Request failed");
        setEnrichedResult(data as EnrichedResult);
      } else {
        // Transcript flow: use existing map-committee route
        const res = await fetch("/api/map-committee", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dealInputs),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Request failed");

        // Wrap in EnrichedResult shape for display
        setEnrichedResult({
          enrichment_available: false,
          company: {
            name: "Transcript Analysis",
            domain: "",
            logoUrl: null,
            employeeCount: null,
            revenue: null,
            industry: null,
            techStack: [],
            recentFunding: null,
            hqLocation: null,
            description: data.deal_summary || null,
          },
          roles: data.roles.map((r: Record<string, unknown>) => ({
            ...r,
            name: null,
            linkedinUrl: null,
            email: null,
            warmth: 0,
            title: r.likely_title,
            waysIn: [],
          })),
          deal_risk_score: 50,
          competitive_signals: null,
          biggest_risk: data.biggest_risk,
          next_moves: data.next_moves,
          pattern: data.pattern,
        });
      }

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      console.error(e);
      toast.error("Something went wrong. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setEnrichedResult(null);
    setInputs(null);
    setIsLoading(false);
    setShowTranscript(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Results page
  if (enrichedResult && !isLoading) {
    return (
      <div className="min-h-screen" style={{ background: "#F6F5F2" }}>
        <EraHeader showMapAnother onReset={handleReset} light />

        <div className="max-w-[720px] mx-auto px-4 md:px-0 pb-16 pt-[80px]">
          <div className="pt-8">
            <ConnectedResultsView inputs={inputs!} result={enrichedResult} onReset={handleReset} />
          </div>
          <footer className="mt-16 text-center" style={{ borderTop: "1px solid #D7DADD", paddingTop: 32 }}>
            <span className="font-body" style={{ fontSize: 13, color: "#5B6670" }}>
              Built by{" "}
              <a href="https://eracx.com" target="_blank" rel="noopener noreferrer" style={{ color: "#1FA7A2" }} className="hover:underline">Era</a>
              {" "}&middot;{" "}
              <a href="https://eracx.com" target="_blank" rel="noopener noreferrer" style={{ color: "#1FA7A2" }} className="hover:underline">eracx.com</a>
            </span>
          </footer>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F6F5F2" }}>
        <div className="text-center">
          <div
            className="mx-auto mb-6"
            style={{
              width: 40,
              height: 40,
              border: "3px solid #D7DADD",
              borderTopColor: "#1FA7A2",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <p className="font-heading" style={{ fontSize: 20, fontWeight: 700, color: "#383838", marginBottom: 8 }}>
            Building your relationship map...
          </p>
          <p className="font-body" style={{ fontSize: 14, fontWeight: 300, color: "#5B6670" }}>
            Enriching {loadingDomain || "company"} &middot; Mapping buying committee &middot; Generating insights
          </p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Input page
  return (
    <div className="min-h-screen" style={{ background: "#F6F5F2" }}>
      <EraHeader light />

      {/* Hero + Form */}
      <div className="max-w-[640px] mx-auto px-4 md:px-0" style={{ paddingTop: 100, paddingBottom: 56 }}>
        {/* Headline */}
        <h1
          className="font-heading"
          style={{ fontSize: 40, fontWeight: 800, color: "#383838", lineHeight: 1.1, marginBottom: 16 }}
        >
          Build your relationship map.
        </h1>
        <p
          className="font-body"
          style={{ fontSize: 16, fontWeight: 300, color: "#5B6670", lineHeight: 1.6, marginBottom: 40 }}
        >
          70% of B2B opportunities have only one contact in the CRM. One person. One thread.
          Know who&apos;s really involved in your biggest deals.
        </p>

        {/* Form Card */}
        {!showTranscript ? (
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: 12,
              border: "1px solid #D7DADD",
              padding: 32,
            }}
          >
            <QuickMapForm onSubmit={handleSubmit} isLoading={isLoading} />
          </div>
        ) : (
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: 12,
              border: "1px solid #D7DADD",
              padding: 32,
            }}
          >
            <TranscriptForm onSubmit={handleSubmit} isLoading={isLoading} />
          </div>
        )}

        {/* Transcript toggle */}
        <p className="text-center mt-4">
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="font-body cursor-pointer hover:underline"
            style={{ fontSize: 13, color: "#5B6670", background: "none", border: "none" }}
          >
            {showTranscript ? "Back to quick map" : "Or drop a transcript \u2192"}
          </button>
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mt-12" style={{ borderTop: "1px solid #D7DADD", paddingTop: 28 }}>
          {STATS.map((stat, i) => (
            <div key={i}>
              <p className="font-heading" style={{ fontSize: 28, fontWeight: 700, color: "#1FA7A2", marginBottom: 8 }}>
                {stat.number}
              </p>
              <p className="font-body" style={{ fontSize: 13, fontWeight: 300, color: "#5B6670", lineHeight: 1.5, marginBottom: 4 }}>
                {stat.text}
              </p>
              <p className="font-body" style={{ fontSize: 11, color: "#D7DADD" }}>
                {stat.source}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center" style={{ padding: "24px 0", borderTop: "1px solid #D7DADD" }}>
        <span className="font-body" style={{ fontSize: 13, color: "#5B6670" }}>
          Built by{" "}
          <a href="https://eracx.com" target="_blank" rel="noopener noreferrer" style={{ color: "#1FA7A2" }} className="hover:underline">Era</a>
          {" "}&middot;{" "}
          <a href="https://eracx.com" target="_blank" rel="noopener noreferrer" style={{ color: "#1FA7A2" }} className="hover:underline">eracx.com</a>
        </span>
      </footer>
    </div>
  );
}
