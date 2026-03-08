import { Slider } from "@/components/ui/slider";

const DEAL_STOPS = ["$10K", "$25K", "$75K", "$200K", "$500K+"];

interface DealSliderProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

const DealSlider = ({ value, onChange, disabled }: DealSliderProps) => (
  <div className="space-y-3">
    <div className="text-center">
      <span className="text-lg font-bold font-body text-primary">{DEAL_STOPS[value]}</span>
    </div>
    <Slider
      value={[value]}
      onValueChange={([v]) => onChange(v)}
      min={0}
      max={DEAL_STOPS.length - 1}
      step={1}
      disabled={disabled}
      className="w-full"
    />
    <div className="flex justify-between">
      {DEAL_STOPS.map((label) => (
        <span key={label} className="text-xs text-muted-foreground font-body">{label}</span>
      ))}
    </div>
  </div>
);

export { DEAL_STOPS };
export default DealSlider;
