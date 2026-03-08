const LoadingDots = () => (
  <span className="inline-flex items-center gap-1">
    <span className="h-2 w-2 rounded-full bg-primary-foreground animate-pulse-dot" />
    <span className="h-2 w-2 rounded-full bg-primary-foreground animate-pulse-dot [animation-delay:0.2s]" />
    <span className="h-2 w-2 rounded-full bg-primary-foreground animate-pulse-dot [animation-delay:0.4s]" />
  </span>
);

export default LoadingDots;
