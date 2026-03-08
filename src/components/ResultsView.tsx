import { useState } from "react";
import { Button } from "@/components/ui/button";
import RoleCard from "@/components/RoleCard";
import type { Role } from "@/components/RoleCard";
import type { DealInputs } from "@/components/InputForm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CommitteeResult {
  roles: Role[];
  biggest_risk: string;
  next_moves: string[];
  pattern: string;
}

interface ResultsViewProps {
  inputs: DealInputs;
  result: CommitteeResult;
  onReset: () => void;
}

const ResultsView = ({ inputs, result, onReset }: ResultsViewProps) => {
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleEmailSubmit = async () => {
    if (!email.trim() || sending) return;
    setSending(true);
    try {
      const { error } = await supabase.from("submissions").insert({
        email: email.trim(),
        what_they_sell: inputs.whatTheySell,
        company_size: inputs.companySize,
        deal_size: inputs.dealSize,
        primary_contact: inputs.primaryContact,
        deal_stage: inputs.dealStage,
        generated_results: result as unknown as Record<string, unknown>,
      });
      if (error) throw error;
      setEmailSent(true);
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-1">Your Buying Committee</h2>
        <p className="text-sm text-muted-foreground">
          {inputs.whatTheySell} → {inputs.companySize} → {inputs.dealSize}
        </p>
      </div>

      {/* Role Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {result.roles.map((role, i) => (
          <RoleCard key={i} role={role} />
        ))}
      </div>

      {/* Biggest Risk */}
      <div className="bg-secondary rounded-lg p-6">
        <h3 className="text-lg font-bold text-foreground mb-2">Your biggest risk right now</h3>
        <p className="font-light text-foreground leading-relaxed">{result.biggest_risk}</p>
      </div>

      {/* Next Moves */}
      <div>
        <h3 className="text-lg font-bold text-foreground mb-4">Your next three moves</h3>
        <ol className="space-y-3">
          {result.next_moves.map((move, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <p className="font-light text-foreground leading-relaxed">{move}</p>
            </li>
          ))}
        </ol>
      </div>

      {/* Pattern */}
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">The pattern to watch</h3>
        <p className="font-light text-muted-foreground leading-relaxed">{result.pattern}</p>
      </div>

      {/* Email Capture */}
      <div className="border border-border rounded-lg p-6">
        <h3 className="text-lg font-bold text-foreground mb-1">Send this map to your inbox</h3>
        <p className="text-sm text-muted-foreground mb-4">We'll email you a clean copy. No spam, no sequence, just your map.</p>
        {emailSent ? (
          <p className="text-primary font-semibold">Sent. Check your inbox.</p>
        ) : (
          <div className="flex gap-3">
            <input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 h-12 px-4 rounded-lg border border-input bg-card text-foreground font-body text-base placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Button onClick={handleEmailSubmit} disabled={!email.trim() || sending}>
              {sending ? "Sending..." : "Send"}
            </Button>
          </div>
        )}
      </div>

      {/* Map Another */}
      <Button variant="outline" size="xl" onClick={onReset}>
        Map another deal
      </Button>
    </div>
  );
};

export default ResultsView;
