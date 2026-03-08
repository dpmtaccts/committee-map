import { useState } from "react";
import { Button } from "@/components/ui/button";
import LoadingDots from "@/components/LoadingDots";

const COMPANY_SIZES = ["Startups (under $10M)", "Mid-Market ($10M–$500M)", "Enterprise ($500M+)"];
const DEAL_SIZES = ["Under $25K", "$25K–$75K", "$75K–$200K", "$200K–$500K", "$500K+"];
const DEAL_STAGES = ["Early conversations", "Evaluating", "Proposal / negotiation", "Stalled"];

export interface DealInputs {
  whatTheySell: string;
  companySize: string;
  dealSize: string;
  primaryContact: string;
  dealStage: string;
}

interface InputFormProps {
  onSubmit: (inputs: DealInputs) => void;
  isLoading: boolean;
}

const selectClass =
  "w-full h-12 px-4 rounded-lg border border-input bg-card text-foreground font-body text-base focus:outline-none focus:ring-2 focus:ring-ring appearance-none";

const InputForm = ({ onSubmit, isLoading }: InputFormProps) => {
  const [inputs, setInputs] = useState<DealInputs>({
    whatTheySell: "",
    companySize: "",
    dealSize: "",
    primaryContact: "",
    dealStage: "",
  });

  const isValid = inputs.whatTheySell.trim() && inputs.companySize && inputs.dealSize && inputs.primaryContact.trim() && inputs.dealStage;

  const handleSubmit = () => {
    if (isValid && !isLoading) onSubmit(inputs);
  };

  const update = (field: keyof DealInputs, value: string) => setInputs((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-normal text-muted-foreground mb-2">What do you sell?</label>
        <input
          type="text"
          placeholder="e.g., Marketing automation platform for mid-market B2B"
          value={inputs.whatTheySell}
          onChange={(e) => update("whatTheySell", e.target.value)}
          disabled={isLoading}
          className="w-full h-12 px-4 rounded-lg border border-input bg-card text-foreground font-body text-base placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        />
      </div>

      <div>
        <label className="block text-sm font-normal text-muted-foreground mb-2">Who are you selling to?</label>
        <select value={inputs.companySize} onChange={(e) => update("companySize", e.target.value)} disabled={isLoading} className={selectClass}>
          <option value="">Select company size</option>
          {COMPANY_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-normal text-muted-foreground mb-2">Deal size</label>
        <select value={inputs.dealSize} onChange={(e) => update("dealSize", e.target.value)} disabled={isLoading} className={selectClass}>
          <option value="">Select deal size</option>
          {DEAL_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-normal text-muted-foreground mb-2">Who's your primary contact?</label>
        <input
          type="text"
          placeholder="e.g., VP of Marketing"
          value={inputs.primaryContact}
          onChange={(e) => update("primaryContact", e.target.value)}
          disabled={isLoading}
          className="w-full h-12 px-4 rounded-lg border border-input bg-card text-foreground font-body text-base placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        />
      </div>

      <div>
        <label className="block text-sm font-normal text-muted-foreground mb-2">Where's the deal right now?</label>
        <select value={inputs.dealStage} onChange={(e) => update("dealStage", e.target.value)} disabled={isLoading} className={selectClass}>
          <option value="">Select deal stage</option>
          {DEAL_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <Button size="xl" onClick={handleSubmit} disabled={!isValid || isLoading} className="mt-2">
        {isLoading ? (
          <span className="flex items-center gap-3">Mapping your committee <LoadingDots /></span>
        ) : (
          "Map this deal"
        )}
      </Button>
    </div>
  );
};

export default InputForm;
