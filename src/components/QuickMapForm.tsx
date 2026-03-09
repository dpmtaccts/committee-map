"use client";

import { useState } from "react";
import SelectionButton from "@/components/SelectionButton";
import DealSlider, { DEAL_STOPS } from "@/components/DealSlider";
import PipelineSelector from "@/components/PipelineSelector";

const PRODUCT_TYPES = ["Software / Platform", "Professional Services", "Hardware / Infrastructure", "Managed Services"];
const INDUSTRIES = ["SaaS / Tech", "Manufacturing", "Healthcare", "Financial Services", "Professional Services", "Retail / E-commerce"];
const BUYING_DEPTS = ["Marketing", "Sales / Revenue", "IT / Engineering", "Finance / Operations", "C-Suite / Executive"];
const COMPANY_SIZES = ["Under $10M", "$10M\u2013$100M", "$100M\u2013$500M", "$500M+"];
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
    <label
      className="block font-body uppercase mb-2"
      style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: "#5B6670" }}
    >
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
    <div className="space-y-6">
      {/* Row 1: What do you sell + Industry */}
      <div className="flex flex-wrap gap-[18px]">
        <div className="flex-1 min-w-[140px]">
          <InputGroup label="What do you sell?">
            <div className="flex flex-wrap gap-2">
              {PRODUCT_TYPES.map((t) => (
                <SelectionButton key={t} label={t} selected={productType === t} onClick={() => setProductType(t)} disabled={isLoading} />
              ))}
            </div>
          </InputGroup>
        </div>
        <div className="flex-1 min-w-[140px]">
          <InputGroup label="Industry">
            <div className="flex flex-wrap gap-2">
              {INDUSTRIES.map((t) => (
                <SelectionButton key={t} label={t} selected={industry === t} onClick={() => setIndustry(t)} disabled={isLoading} />
              ))}
            </div>
          </InputGroup>
        </div>
      </div>

      {/* Row 2: Who buys it + Company size */}
      <div className="flex flex-wrap gap-[18px]">
        <div className="flex-1 min-w-[140px]">
          <InputGroup label="Who buys it?">
            <div className="flex flex-wrap gap-2">
              {BUYING_DEPTS.map((t) => (
                <SelectionButton key={t} label={t} selected={buyingDepartment === t} onClick={() => setBuyingDepartment(t)} disabled={isLoading} />
              ))}
            </div>
          </InputGroup>
        </div>
        <div className="flex-1 min-w-[140px]">
          <InputGroup label="Company size">
            <div className="flex flex-wrap gap-2">
              {COMPANY_SIZES.map((t) => (
                <SelectionButton key={t} label={t} selected={companySize === t} onClick={() => setCompanySize(t)} disabled={isLoading} />
              ))}
            </div>
          </InputGroup>
        </div>
      </div>

      {/* Row 3: Deal size (full width) */}
      <InputGroup label="Deal size">
        <DealSlider value={dealSizeIndex} onChange={setDealSizeIndex} disabled={isLoading} />
      </InputGroup>

      {/* Row 4: Deal stage + Your contact */}
      <div className="flex flex-wrap gap-[18px]">
        <div className="flex-1 min-w-[140px]">
          <InputGroup label="Where's the deal?">
            <PipelineSelector value={dealStage} onChange={setDealStage} disabled={isLoading} />
          </InputGroup>
        </div>
        <div className="flex-1 min-w-[140px]">
          <InputGroup label="Your current contact">
            <div className="flex flex-wrap gap-2">
              {CONTACT_LEVELS.map((t) => (
                <SelectionButton key={t} label={t} selected={contactLevel === t} onClick={() => setContactLevel(t)} disabled={isLoading} />
              ))}
            </div>
          </InputGroup>
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={handleSubmit}
        disabled={!isValid || isLoading}
        className="w-full font-body font-semibold cursor-pointer transition-all duration-150"
        style={{
          height: 48,
          borderRadius: 8,
          fontSize: 14,
          border: "none",
          background: isValid && !isLoading ? "#2A9D8F" : "#E8E7E4",
          color: isValid && !isLoading ? "#FFFFFF" : "#BCBCBC",
          boxShadow: isValid && !isLoading ? "0 4px 20px rgba(42,157,143,0.3)" : "none",
        }}
      >
        Build my map
      </button>
    </div>
  );
};

export default QuickMapForm;
