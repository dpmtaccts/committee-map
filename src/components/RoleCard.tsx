interface Role {
  role: string;
  likely_title: string;
  what_they_care_about: string;
  how_they_evaluate: string;
  status: "covered" | "gap" | "risk";
}

const statusConfig = {
  covered: { label: "Covered", borderClass: "border-l-primary", badgeClass: "bg-primary/15 text-primary" },
  gap: { label: "Gap", borderClass: "border-l-warning", badgeClass: "bg-warning/15 text-warning" },
  risk: { label: "Risk", borderClass: "border-l-destructive", badgeClass: "bg-destructive/15 text-destructive" },
};

const RoleCard = ({ role }: { role: Role }) => {
  const config = statusConfig[role.status];

  return (
    <div className={`bg-card rounded-lg border border-border border-l-4 ${config.borderClass} p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]`}>
      <div className="flex items-start justify-between mb-1">
        <h3 className="font-bold text-foreground text-lg font-heading">{role.role}</h3>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${config.badgeClass}`}>
          {config.label}
        </span>
      </div>
      <p className="text-[15px] font-normal text-muted-foreground mb-3 font-body">{role.likely_title}</p>
      <div className="space-y-2">
        <div>
          <span className="text-xs font-normal text-muted-foreground uppercase tracking-widest font-body">What they care about</span>
          <p className="text-[15px] font-light text-foreground font-body">{role.what_they_care_about}</p>
        </div>
        <div>
          <span className="text-xs font-normal text-muted-foreground uppercase tracking-widest font-body">How they evaluate</span>
          <p className="text-[15px] font-light text-foreground font-body">{role.how_they_evaluate}</p>
        </div>
      </div>
    </div>
  );
};

export default RoleCard;
export type { Role };
