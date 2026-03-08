import { useState } from "react";
import { Button } from "@/components/ui/button";
import RoleCard from "@/components/RoleCard";
import type { Role } from "@/components/RoleCard";
import type { QuickMapInputs } from "@/components/QuickMapForm";
import type { TranscriptInputs } from "@/components/TranscriptForm";
import { supabase } from "@/integrations/supabase/client";
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
      ? `${inputs.productType} → ${inputs.industry} → ${inputs.dealSize} deal → ${inputs.dealStage}`
      : result.deal_summary || "Based on your discovery call transcript";

  const handleEmailSubmit = async () => {
    if (!email.trim() || sending) return;
    setSending(true);
    try {
      const insertData: Record<string, unknown> = {
        email: email.trim(),
        input_path: inputs.path,
        results: JSON.parse(JSON.stringify(result)),
      };
      if (inputs.path === "quick_map") {
        insertData.product_type = inputs.productType;
        insertData.industry = inputs.industry;
        insertData.buying_department = inputs.buyingDepartment;
        insertData.company_size = inputs.companySize;
        insertData.deal_size = inputs.dealSize;
        insertData.deal_stage = inputs.dealStage;
        insertData.contact_level = inputs.contactLevel;
      } else {
        insertData.deal_summary = result.deal_summary || null;
      }
      const { error } = await supabase.from("submissions").insert(insertData as any);
      if (error) throw error;
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
        <h2 className="text-[32px] font-black text-foreground mb-1 font-heading">Your Buying Committee</h2>
        <p className="text-sm font-normal text-muted-foreground font-body">{summaryLine}</p>
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
      <div className="bg-secondary rounded-lg p-6 animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: "400ms", animationFillMode: "both" }}>
        <h3 className="text-lg font-bold text-destructive mb-2 font-heading">Your biggest risk right now</h3>
        <p className="font-light text-foreground leading-relaxed font-body">{result.biggest_risk}</p>
      </div>

      {/* Next Moves */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: "500ms", animationFillMode: "both" }}>
        <h3 className="text-xl font-bold text-foreground mb-4 font-heading">Your next three moves</h3>
        <div className="space-y-3">
          {result.next_moves.map((move, i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-4 flex gap-3">
              <span className="flex-shrink-0 text-2xl font-bold text-primary font-body">{i + 1}.</span>
              <p className="font-light text-foreground leading-relaxed font-body pt-1">{move}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pattern */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: "600ms", animationFillMode: "both" }}>
        <h3 className="text-xl font-bold text-foreground mb-2 font-heading">The pattern to watch</h3>
        <p className="font-light text-muted-foreground leading-relaxed font-body">{result.pattern}</p>
      </div>

      {/* Email Capture */}
      <div className="bg-card border border-border rounded-lg p-6 text-center animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: "700ms", animationFillMode: "both" }}>
        {emailSent ? (
          <div className="flex items-center justify-center gap-2 text-primary animate-in fade-in duration-200">
            <Check className="w-5 h-5" />
            <span className="font-semibold font-body">Sent. Check your inbox.</span>
          </div>
        ) : (
          <>
            <h3 className="text-lg font-bold text-foreground mb-1 font-heading">Send this map to your inbox</h3>
            <p className="text-sm font-light text-muted-foreground mb-4 font-body">
              A clean copy, nothing else. No spam, no sequence.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 h-11 px-4 rounded-lg border border-input bg-card text-foreground font-body text-base placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <Button onClick={handleEmailSubmit} disabled={!email.trim() || sending} className="h-11">
                {sending ? "Sending..." : "Send"}
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Map Another */}
      <Button variant="outline" size="xl" onClick={onReset} className="h-12">
        Map another deal
      </Button>
    </div>
  );
};

export default ResultsView;
