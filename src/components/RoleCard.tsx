interface Role {
  role: string;
  likely_title: string;
  what_they_care_about: string;
  how_they_evaluate: string;
  status: "covered" | "gap" | "risk";
}

const statusConfig = {
  covered: { label: "Covered", borderClass: "border-l-primary", badgeClass: "bg-primary/10 text-primary" },
  gap: { label: "Gap", borderClass: "border-l-warning", badgeClass: "bg-warning/10 text-warning" },
  risk: { label: "Risk", borderClass: "border-l-destructive", badgeClass: "bg-destructive/10 text-destructive" },
};

const RoleCard = ({ role }: { role: Role }) => {
  const config = statusConfig[role.status];

  return (
    <div className={`bg-card rounded-lg border border-border border-l-4 ${config.borderClass} p-5`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-foreground text-base">{role.role}</h3>
          <p className="text-sm text-muted-foreground">{role.likely_title}</p>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${config.badgeClass}`}>
          {config.label}
        </span>
      </div>
      <div className="space-y-2 text-sm">
        <p className="font-light text-foreground"><span className="font-normal text-muted-foreground">Cares about:</span> {role.what_they_care_about}</p>
        <p className="font-light text-foreground"><span className="font-normal text-muted-foreground">Evaluates by:</span> {role.how_they_evaluate}</p>
      </div>
    </div>
  );
};

export default RoleCard;
export type { Role };
