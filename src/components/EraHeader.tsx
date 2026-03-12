"use client";

const NAV_LINKS = [
  { label: "Why Era", href: "https://eracx.com/#why-era" },
  { label: "The System", href: "https://eracx.com/#the-system" },
  { label: "GTM Design", href: "https://eracx.com/gtm-design" },
  { label: "How It Works", href: "https://eracx.com/#how-it-works" },
  { label: "Our Story", href: "https://eracx.com/our-story" },
  { label: "Contact", href: "https://eracx.com/#contact" },
];

const EraHeader = ({
  showMapAnother,
  onReset,
  light = false,
}: {
  showMapAnother?: boolean;
  onReset?: () => void;
  light?: boolean;
}) => {
  const textColor = light ? "#111111" : "#F5F0E8";
  const textMuted = light ? "rgba(17,17,17,0.5)" : "rgba(245,240,232,0.5)";
  const logoFilter = light
    ? "brightness(0)"
    : "brightness(0) invert(1) sepia(1) saturate(0.1) brightness(0.93)";
  const bgClass = light ? "bg-[#F5F0E8]/90" : "bg-[#111111]/90";

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 ${bgClass}`}
      style={{
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-5 md:px-10">
        <a href="https://eracx.com" className="flex-shrink-0">
          <img
            src="/era_final.png"
            alt="Era"
            className="mt-1 h-5 w-auto transition-[filter] duration-500"
            style={{ filter: logoFilter }}
          />
        </a>

        <div className="hidden items-center gap-10 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="relative pb-1 text-[11px] uppercase tracking-[0.2em] transition-colors duration-300"
              style={{ color: textMuted }}
            >
              {link.label}
            </a>
          ))}
          {showMapAnother && (
            <button
              onClick={onReset}
              className="text-[11px] uppercase tracking-[0.2em] cursor-pointer transition-colors duration-300 hover:underline"
              style={{ color: textColor, background: "none", border: "none" }}
            >
              New Map
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default EraHeader;
