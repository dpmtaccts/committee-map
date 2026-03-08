import { useState } from "react";
import SelectionButton from "@/components/SelectionButton";
import DealSlider, { DEAL_STOPS } from "@/components/DealSlider";
import PipelineSelector from "@/components/PipelineSelector";
import { Button } from "@/components/ui/button";

const PRODUCT_TYPES = ["Software / Platform", "Professional Services", "Hardware / Infrastructure", "Managed Services"];
const INDUSTRIES = ["SaaS / Tech", "Manufacturing", "Healthcare", "Financial Services", "Professional Services", "Retail / E-commerce"];
const BUYING_DEPTS = ["Marketing", "Sales / Revenue", "IT / Engineering", "Finance / Operations", "C-Suite / Executive"];
const COMPANY_SIZES = ["Under $10M", "$10M–$100M", "$100M–$500M", "$500M+"];
const CONTACT_LEVELS = ["C-Level", "VP", "Director", "Manager", "IC"];

export interface QuickMapInputs {
  path: "quick_map";
  productType: string;
  industry: string;
  buyingDepartment: string;
  companySize: string;
  dealSize: string;
  dealStage: string;
  contactLevel: string;
}

interface QuickMapFormProps {
  onSubmit: (inputs: QuickMapInputs) => void;
  isLoading: boolean;
}

const InputGroup = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-[13px] font-normal text-muted-foreground mb-3 uppercase tracking-widest font-body">
      {label}
    </label>
    {children}
  </div>
);

const QuickMapForm = ({ onSubmit, isLoading }: QuickMapFormProps) => {
  const [productType, setProductType] = useState("");
  const [industry, setIndustry] = useState("");
  const [buyingDepartment, setBuyingDepartment] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [dealSizeIndex, setDealSizeIndex] = useState(2);
  const [dealStage, setDealStage] = useState("");
  const [contactLevel, setContactLevel] = useState("");

  const isValid = productType && industry && buyingDepartment && companySize && dealStage && contactLevel;

  const handleSubmit = () => {
    if (!isValid || isLoading) return;
    onSubmit({
      path: "quick_map",
      productType,
      industry,
      buyingDepartment,
      companySize,
      dealSize: DEAL_STOPS[dealSizeIndex],
      dealStage,
      contactLevel,
    });
  };

  return (
    <div className="space-y-8">
      <InputGroup label="What do you sell?">
        <div className="flex flex-wrap gap-3">
          {PRODUCT_TYPES.map((t) => (
            <SelectionButton key={t} label={t} selected={productType === t} onClick={() => setProductType(t)} disabled={isLoading} />
          ))}
        </div>
      </InputGroup>

      <InputGroup label="Your industry">
        <div className="flex flex-wrap gap-3">
          {INDUSTRIES.map((t) => (
            <SelectionButton key={t} label={t} selected={industry === t} onClick={() => setIndustry(t)} disabled={isLoading} />
          ))}
        </div>
      </InputGroup>

      <InputGroup label="Who buys it?">
        <div className="flex flex-wrap gap-3">
          {BUYING_DEPTS.map((t) => (
            <SelectionButton key={t} label={t} selected={buyingDepartment === t} onClick={() => setBuyingDepartment(t)} disabled={isLoading} />
          ))}
        </div>
      </InputGroup>

      <InputGroup label="Company size">
        <div className="flex flex-wrap gap-3">
          {COMPANY_SIZES.map((t) => (
            <SelectionButton key={t} label={t} selected={companySize === t} onClick={() => setCompanySize(t)} disabled={isLoading} />
          ))}
        </div>
      </InputGroup>

      <InputGroup label="Deal size">
        <DealSlider value={dealSizeIndex} onChange={setDealSizeIndex} disabled={isLoading} />
      </InputGroup>

      <InputGroup label="Where's the deal?">
        <PipelineSelector value={dealStage} onChange={setDealStage} disabled={isLoading} />
      </InputGroup>

      <InputGroup label="Your current contact">
        <div className="flex flex-wrap gap-3">
          {CONTACT_LEVELS.map((t) => (
            <SelectionButton key={t} label={t} selected={contactLevel === t} onClick={() => setContactLevel(t)} disabled={isLoading} />
          ))}
        </div>
      </InputGroup>

      <Button
        size="xl"
        onClick={handleSubmit}
        disabled={!isValid || isLoading}
        className="mt-2 h-[52px]"
      >
        Map this deal
      </Button>
    </div>
  );
};

export default QuickMapForm;
