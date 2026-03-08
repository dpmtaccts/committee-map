import { useState, useEffect } from "react";
import LoadingDots from "@/components/LoadingDots";

const MESSAGES = [
  "Reading your deal...",
  "Identifying the committee...",
  "Finding the gaps...",
  "Building your map...",
];

const LoadingState = () => {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-24">
      <LoadingDots />
      <p
        key={msgIndex}
        className="mt-6 text-base font-light text-muted-foreground font-body animate-in fade-in duration-300"
      >
        {MESSAGES[msgIndex]}
      </p>
    </div>
  );
};

export default LoadingState;
