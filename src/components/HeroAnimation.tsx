"use client";

import { useEffect, useRef } from "react";

// Animated canvas background: horizontal sweep lines of dots
// on dark background with teal glow
function SweepCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0, h = 0;

    const rowPositions = [0.15, 0.28, 0.42, 0.58, 0.72, 0.86];
    const speeds = [0.6, 0.9, 0.5, 0.8, 0.4, 0.7];
    const offsets = [0, 0.35, 0.6, 0.15, 0.8, 0.45];
    const dotSpacing = 18;
    const dotRadius = 1.0;

    function resize() {
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resize();
    window.addEventListener("resize", resize);

    const phases = rowPositions.map((_, i) => offsets[i]);

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);

      for (let r = 0; r < rowPositions.length; r++) {
        const y = rowPositions[r] * h;
        const speed = speeds[r];
        phases[r] = (phases[r] + speed / w) % 1;
        const phase = phases[r];
        const cols = Math.ceil(w / dotSpacing);

        for (let c = 0; c < cols; c++) {
          const x = c * dotSpacing;
          const xRatio = x / w;
          let dist = phase - xRatio;
          if (dist < 0) dist += 1;

          let alpha: number;
          if (dist < 0.02) alpha = 0.4;
          else if (dist < 0.15) alpha = 0.4 * (1 - (dist - 0.02) / 0.13);
          else alpha = 0.03;

          const edge = Math.min(xRatio / 0.1, (1 - xRatio) / 0.1, 1);
          alpha *= edge;

          ctx.beginPath();
          ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(42, 157, 143, ${alpha})`;
          ctx.fill();
        }
      }

      frameRef.current = requestAnimationFrame(draw);
    }

    frameRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}

export default function HeroAnimation() {
  return <SweepCanvas />;
}
