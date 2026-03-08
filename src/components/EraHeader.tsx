const EraHeader = ({ showMapAnother, onReset }: { showMapAnother?: boolean; onReset?: () => void }) => (
  <header className="flex items-center justify-between py-6">
    <span className="text-2xl font-black tracking-tight font-heading text-foreground">era</span>
    {showMapAnother && (
      <button onClick={onReset} className="text-sm font-semibold text-primary hover:underline cursor-pointer">
        Map another deal
      </button>
    )}
  </header>
);

export default EraHeader;
