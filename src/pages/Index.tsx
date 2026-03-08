import { useState } from "react";
import EraHeader from "@/components/EraHeader";
import InputForm from "@/components/InputForm";
import type { DealInputs } from "@/components/InputForm";
import ResultsView from "@/components/ResultsView";
import type { CommitteeResult } from "@/components/ResultsView";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Index = () => {
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
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[720px] mx-auto px-4 md:px-0 pb-16">
        <EraHeader showMapAnother={!!result} onReset={handleReset} />

        {!result ? (
          <div className="pt-12 md:pt-20">
            <div className="mb-10">
              <h1 className="text-4xl md:text-[48px] font-black text-foreground leading-tight mb-3">
                Map your buying committee in 60 seconds.
              </h1>
              <p className="text-lg font-light text-muted-foreground">
                Drop in a deal. See who you're missing. Get your next move.
              </p>
            </div>
            <InputForm onSubmit={handleSubmit} isLoading={isLoading} />
          </div>
        ) : (
          <div className="pt-8">
            <ResultsView inputs={inputs!} result={result} onReset={handleReset} />
          </div>
        )}

        <footer className="mt-16 text-center">
          <a href="https://eracx.com" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            Built by Era
          </a>
        </footer>
      </div>
    </div>
  );
};

export default Index;
