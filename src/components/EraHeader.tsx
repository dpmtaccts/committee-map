import eraLogo from "@/assets/era-logo.png";

const EraHeader = ({ showMapAnother, onReset }: { showMapAnother?: boolean; onReset?: () => void }) => (
  <header className="flex items-center justify-between py-6">
    <img src={eraLogo} alt="Era" className="h-5" />
    {showMapAnother && (
      <button onClick={onReset} className="text-sm font-semibold text-primary hover:underline cursor-pointer font-body">
        Map another deal
      </button>
    )}
  </header>
);

export default EraHeader;
