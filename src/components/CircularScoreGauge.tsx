import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { getReadinessLabel } from "../utils/scoring";

interface CircularScoreGaugeProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

export function CircularScoreGauge({
  score,
  size = 164,
  strokeWidth = 12,
}: CircularScoreGaugeProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const readiness = getReadinessLabel(clamped);

  useEffect(() => {
    let frameId: number;
    const duration = 700;
    const start = performance.now();
    const from = 0;

    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayScore(Math.round(from + (clamped - from) * eased));
      if (t < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [clamped]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const targetOffset = circumference - (clamped / 100) * circumference;

  const strokeColor =
    readiness.tone === "green"
      ? "#16a34a"
      : readiness.tone === "amber"
      ? "#d97706"
      : "#dc2626";

  const textToneClass =
    readiness.tone === "green"
      ? "text-emerald-600 dark:text-emerald-400"
      : readiness.tone === "amber"
      ? "text-amber-600 dark:text-amber-400"
      : "text-rose-600 dark:text-rose-400";

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
          role="img"
          aria-label={`Compatibility score ${clamped} out of 100`}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            className="stroke-slate-100 dark:stroke-slate-800"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: targetOffset }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-mono-tabular text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {displayScore}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            out of 100
          </span>
        </div>
      </div>

      <p className={`mt-3 text-sm font-semibold ${textToneClass}`}>
        {readiness.label}
      </p>
    </div>
  );
}
