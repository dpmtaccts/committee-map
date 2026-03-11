"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface Role {
  role: string;
  likely_title: string;
  what_they_care_about: string;
  how_they_evaluate: string;
  status: "covered" | "gap" | "risk";
}

const ROLE_BORDER_COLORS: Record<string, string> = {
  "Economic Buyer": "#B85C4A",
  "Champion": "#1FA7A2",
  "Technical Evaluator": "#D6B26D",
  "Coach": "#D43D8D",
  "End User": "#5B6670",
  "Blocker": "#B85C4A",
};

const statusConfig = {
  covered: { label: "Covered", color: "#1FA7A2", bg: "rgba(31,167,162,0.1)" },
  gap: { label: "Gap", color: "#B85C4A", bg: "rgba(184,92,74,0.1)" },
  risk: { label: "Risk", color: "#C4484E", bg: "rgba(196,72,78,0.1)" },
};

const RoleCard = ({ role }: { role: Role }) => {
  const [expanded, setExpanded] = useState(false);
  const config = statusConfig[role.status];
  const borderColor = ROLE_BORDER_COLORS[role.role] || "#5B6670";

  return (
    <div
      className="rounded-xl overflow-hidden cursor-pointer transition-shadow duration-200"
      style={{
        background: "#FFFFFF",
        border: "1px solid #D7DADD",
        borderLeft: `4px solid ${borderColor}`,
        boxShadow: expanded ? "0 4px 20px rgba(0,0,0,0.08)" : "0 1px 3px rgba(0,0,0,0.04)",
      }}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-1">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg font-heading" style={{ color: "#383838" }}>{role.role}</h3>
              <span
                className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                style={{ background: config.bg, color: config.color }}
              >
                {config.label}
              </span>
            </div>
            <p className="font-body" style={{ fontSize: 14, color: "#5B6670", marginTop: 2 }}>{role.likely_title}</p>
          </div>
          <ChevronDown
            className="w-4 h-4 transition-transform duration-200 flex-shrink-0 mt-1"
            style={{ color: "#5B6670", transform: expanded ? "rotate(180deg)" : "rotate(0)" }}
          />
        </div>
      </div>

      <div
        style={{
          maxHeight: expanded ? 400 : 0,
          opacity: expanded ? 1 : 0,
          overflow: "hidden",
          transition: "max-height 0.3s ease-out, opacity 0.2s ease-out",
        }}
      >
        <div className="px-5 pb-5 space-y-3" style={{ borderTop: "1px solid #F6F5F2" }}>
          <div className="pt-3">
            <span className="font-body uppercase" style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: "#5B6670" }}>
              What they care about
            </span>
            <p className="font-body mt-1" style={{ fontSize: 14, fontWeight: 300, color: "#383838", lineHeight: 1.5 }}>
              {role.what_they_care_about}
            </p>
          </div>
          <div>
            <span className="font-body uppercase" style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: "#5B6670" }}>
              How they evaluate
            </span>
            <p className="font-body mt-1" style={{ fontSize: 14, fontWeight: 300, color: "#383838", lineHeight: 1.5 }}>
              {role.how_they_evaluate}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleCard;
export type { Role };
