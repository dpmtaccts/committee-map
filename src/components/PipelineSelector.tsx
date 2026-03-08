const STAGES = [
  { value: "Early", label: "Early" },
  { value: "Evaluating", label: "Evaluating" },
  { value: "Proposal", label: "Proposal" },
  { value: "Stalled", label: "Stalled" },
];

interface PipelineSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const PipelineSelector = ({ value, onChange, disabled }: PipelineSelectorProps) => {
  const selectedIndex = STAGES.findIndex((s) => s.value === value);

  return (
    <div className="flex items-center justify-between w-full max-w-md mx-auto">
      {STAGES.map((stage, i) => {
        const isSelected = stage.value === value;
        const isStalled = stage.value === "Stalled";
        const isFilled = selectedIndex >= 0 && i <= selectedIndex && !isStalled;
        const isFilledStalled = isStalled && isSelected;

        return (
          <div key={stage.value} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={() => !disabled && onChange(stage.value)}
                disabled={disabled}
                className={`
                  w-10 h-10 rounded-full border-2 cursor-pointer transition-all duration-200
                  flex items-center justify-center
                  ${isSelected && isStalled
                    ? "bg-warning border-warning"
                    : isSelected || isFilled
                      ? "bg-primary border-primary"
                      : "bg-card border-border"
                  }
                  disabled:cursor-not-allowed
                `}
              >
                {isSelected && (
                  <div className={`w-3 h-3 rounded-full ${isFilledStalled ? "bg-warning-foreground" : "bg-primary-foreground"}`} />
                )}
              </button>
              <span
                className={`text-xs font-semibold mt-2 font-body transition-colors duration-200
                  ${isSelected && isStalled
                    ? "text-warning"
                    : isSelected
                      ? "text-primary"
                      : "text-muted-foreground"
                  }
                `}
              >
                {stage.label}
              </span>
            </div>
            {i < STAGES.length - 1 && (
              <div className="flex-1 h-0.5 mx-2 mb-6">
                <div
                  className={`h-full transition-colors duration-200 rounded-full ${
                    selectedIndex > i && !(STAGES[selectedIndex]?.value === "Stalled")
                      ? "bg-primary"
                      : "bg-border"
                  }`}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PipelineSelector;
