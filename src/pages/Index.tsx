import { useState } from "react";
import EraHeader from "@/components/EraHeader";
import QuickMapForm from "@/components/QuickMapForm";
import type { QuickMapInputs } from "@/components/QuickMapForm";
import TranscriptForm from "@/components/TranscriptForm";
import type { TranscriptInputs } from "@/components/TranscriptForm";
import LoadingState from "@/components/LoadingState";
import ResultsView from "@/components/ResultsView";
import type { CommitteeResult, DealInputs } from "@/components/ResultsView";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Tab = "quick" | "transcript";

const Index = () => {
  const [tab, setTab] = useState<Tab>("quick");
  const [isLoading, setIsLoading] = useState(false);
  const [inputs, setInputs] = useState<DealInputs | null>(null);
  const [result, setResult] = useState<CommitteeResult | null>(null);

  const handleSubmit = async (dealInputs: DealInputs) => {
    setIsLoading(true);
    setInputs(dealInputs);
    try {
      const { data, error } = await supabase.functions.invoke("map-committee", {
        body: dealInputs,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data as CommitteeResult);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      console.error(e);
      toast.error("Something went wrong. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setInputs(null);
    setIsLoading(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[720px] mx-auto px-4 md:px-0 pb-16">
        <EraHeader showMapAnother={!!result} onReset={handleReset} />

        {isLoading ? (
          <LoadingState />
        ) : result ? (
          <div className="pt-8">
            <ResultsView inputs={inputs!} result={result} onReset={handleReset} />
          </div>
        ) : (
          <div className="pt-12 md:pt-20">
            <div className="mb-10">
              <h1 className="text-4xl md:text-[48px] font-black text-foreground leading-tight mb-3 font-heading">
                Map your buying committee in 60 seconds.
              </h1>
              <p className="text-lg font-light text-muted-foreground font-body">
                See who you're missing. Get your next move.
              </p>
            </div>

            {/* Tab toggle */}
            <div className="flex gap-0 mb-8 border-b border-border">
              <button
                onClick={() => setTab("quick")}
                className={`px-5 py-3 text-base font-semibold font-body transition-colors cursor-pointer
                  ${tab === "quick"
                    ? "text-primary border-b-2 border-primary -mb-px"
                    : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                Quick Map
              </button>
              <button
                onClick={() => setTab("transcript")}
                className={`px-5 py-3 text-base font-semibold font-body transition-colors cursor-pointer
                  ${tab === "transcript"
                    ? "text-primary border-b-2 border-primary -mb-px"
                    : "text-muted-foreground hover:text-foreground"
                  }`}
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
        )}

        <footer className="mt-16 text-center">
          <span className="text-sm text-muted-foreground font-body">
            Built by{" "}
            <a href="https://eracx.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Era
            </a>
          </span>
        </footer>
      </div>
    </div>
  );
};

export default Index;
