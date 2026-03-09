"use client";

const EraHeader = ({ showMapAnother, onReset }: { showMapAnother?: boolean; onReset?: () => void }) => (
  <header
    className="fixed top-0 left-0 right-0 z-50"
    style={{
      background: "rgba(14,16,19,0.9)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      borderBottom: "1px solid rgba(255,255,255,0.04)",
    }}
  >
    <div className="max-w-[1100px] mx-auto flex items-center justify-between" style={{ padding: "14px 32px" }}>
      <img
        src="/era-logo.png"
        alt="Era"
        style={{ height: 22, filter: "brightness(0) invert(1)" }}
      />
      <div className="flex items-center gap-4">
        {showMapAnother && (
          <button
            onClick={onReset}
            className="text-sm font-semibold cursor-pointer font-body hover:underline"
            style={{ color: "#2A9D8F" }}
          >
            Map another deal
          </button>
        )}
        <span className="font-body" style={{ fontSize: 12, fontWeight: 400, color: "rgba(255,255,255,0.25)" }}>
          Relationship Map
        </span>
      </div>
    </div>
  </header>
);

export default EraHeader;
