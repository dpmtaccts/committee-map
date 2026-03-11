"use client";

import { useState } from "react";

const ROLES = [
  "VP of Sales",
  "VP of Marketing",
  "Head of Sales",
  "Chief Revenue Officer",
  "Sales Director",
  "VP of Operations",
  "Marketing Director",
  "Head of Growth",
];

export interface QuickMapInputs {
  path: "quick_map";
  companyDomain: string;
  roleContext: string | null;
  linkedinUrl: string | null;
  // Legacy fields for backward compat
  productType?: string;
  industry?: string;
  buyingDepartment?: string;
  companySize?: string;
  dealSize?: string;
  dealStage?: string;
  contactLevel?: string;
  email?: string;
}

interface QuickMapFormProps {
  onSubmit: (inputs: QuickMapInputs) => void;
  isLoading: boolean;
}

type MappingMode = "linkedin" | "role" | null;

const QuickMapForm = ({ onSubmit, isLoading }: QuickMapFormProps) => {
  const [companyDomain, setCompanyDomain] = useState("");
  const [mappingMode, setMappingMode] = useState<MappingMode>(null);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [selectedRole, setSelectedRole] = useState("");

  const hasDomain = companyDomain.trim().length > 0;
  const hasLinkedin = mappingMode === "linkedin" && linkedinUrl.trim().length > 0;
  const hasRole = mappingMode === "role" && selectedRole.length > 0;
  const isValid = hasDomain && (hasLinkedin || hasRole);

  const handleSubmit = () => {
    if (!isValid || isLoading) return;
    onSubmit({
      path: "quick_map",
      companyDomain: companyDomain.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, ""),
      roleContext: mappingMode === "role" ? selectedRole : null,
      linkedinUrl: mappingMode === "linkedin" ? linkedinUrl.trim() : null,
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {/* Company Domain */}
      <div>
        <label
          className="block font-body uppercase"
          style={{ fontSize: 11, fontWeight: 600, letterSpacing: 2, color: "#5B6670", marginBottom: 8 }}
        >
          Company Domain
        </label>
        <input
          type="text"
          placeholder="company.com"
          value={companyDomain}
          onChange={(e) => setCompanyDomain(e.target.value)}
          className="w-full font-body focus:outline-none transition-colors"
          style={{
            height: 48,
            padding: "0 16px",
            fontSize: 15,
            borderRadius: 8,
            color: "#383838",
            background: "#F6F5F2",
            border: hasDomain ? "1.5px solid #1FA7A2" : "1.5px solid transparent",
          }}
        />
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "#D7DADD" }} />

      {/* Who are we mapping? */}
      <div>
        <label
          className="block font-body uppercase"
          style={{ fontSize: 11, fontWeight: 600, letterSpacing: 2, color: "#5B6670", marginBottom: 12 }}
        >
          Who are we mapping?
        </label>

        {/* Toggle buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setMappingMode(mappingMode === "linkedin" ? null : "linkedin")}
            className="flex-1 font-body cursor-pointer transition-all duration-150"
            style={{
              padding: "10px 12px",
              fontSize: 14,
              borderRadius: 8,
              fontWeight: mappingMode === "linkedin" ? 600 : 400,
              border: mappingMode === "linkedin" ? "1.5px solid #1FA7A2" : "1.5px solid #D7DADD",
              background: mappingMode === "linkedin" ? "rgba(31,167,162,0.06)" : "#FFFFFF",
              color: mappingMode === "linkedin" ? "#1FA7A2" : "#383838",
            }}
          >
            I have a LinkedIn profile
          </button>
          <button
            type="button"
            onClick={() => setMappingMode(mappingMode === "role" ? null : "role")}
            className="flex-1 font-body cursor-pointer transition-all duration-150"
            style={{
              padding: "10px 12px",
              fontSize: 14,
              borderRadius: 8,
              fontWeight: mappingMode === "role" ? 600 : 400,
              border: mappingMode === "role" ? "1.5px solid #1FA7A2" : "1.5px solid #D7DADD",
              background: mappingMode === "role" ? "rgba(31,167,162,0.06)" : "#FFFFFF",
              color: mappingMode === "role" ? "#1FA7A2" : "#383838",
            }}
          >
            Show me by role
          </button>
        </div>

        {/* LinkedIn URL input */}
        {mappingMode === "linkedin" && (
          <div className="mt-4 animate-in fade-in duration-200">
            <input
              type="text"
              placeholder="linkedin.com/in/name"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              className="w-full font-body focus:outline-none transition-colors"
              style={{
                height: 48,
                padding: "0 16px",
                fontSize: 15,
                borderRadius: 8,
                color: "#383838",
                background: "#F6F5F2",
                border: hasLinkedin ? "1.5px solid #1FA7A2" : "1.5px solid transparent",
              }}
            />
          </div>
        )}

        {/* Role chips */}
        {mappingMode === "role" && (
          <div className="mt-4 flex flex-wrap gap-2 animate-in fade-in duration-200">
            {ROLES.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setSelectedRole(selectedRole === role ? "" : role)}
                className="font-body cursor-pointer transition-all duration-150"
                style={{
                  padding: "8px 16px",
                  fontSize: 14,
                  borderRadius: 999,
                  fontWeight: selectedRole === role ? 600 : 400,
                  border: selectedRole === role ? "1.5px solid #1FA7A2" : "1.5px solid #D7DADD",
                  background: selectedRole === role ? "rgba(31,167,162,0.06)" : "#FFFFFF",
                  color: selectedRole === role ? "#1FA7A2" : "#383838",
                }}
              >
                {role}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Build my map button */}
      <button
        onClick={handleSubmit}
        disabled={!isValid || isLoading}
        className="w-full font-body font-semibold cursor-pointer transition-all duration-150"
        style={{
          height: 52,
          borderRadius: 8,
          fontSize: 16,
          border: "none",
          background: isValid && !isLoading ? "#383838" : "#D7DADD",
          color: isValid && !isLoading ? "#FFFFFF" : "#5B6670",
        }}
        onMouseEnter={(e) => {
          if (isValid && !isLoading) e.currentTarget.style.background = "#1FA7A2";
        }}
        onMouseLeave={(e) => {
          if (isValid && !isLoading) e.currentTarget.style.background = "#383838";
        }}
      >
        {isLoading ? "Building..." : "Build my map"}
      </button>
    </div>
  );
};

export default QuickMapForm;
