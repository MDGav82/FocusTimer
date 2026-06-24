import { useEffect, useMemo, useState } from "react";
import type { UIPeriod } from "@/domain/types";

export function useTimer(periods: UIPeriod[], initialIndex = 0) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState(() => periods[initialIndex]?.durationSec ?? 0);

  useEffect(() => {
    setRemaining(periods[activeIndex]?.durationSec ?? 0);
  }, [periods, activeIndex]);

  useEffect(() => {
    if (!running || remaining <= 0) return;
    const id = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(id);
  }, [running, remaining]);

  const start = () => setRunning(true);
  const pause = () => setRunning(false);
  const reset = () => setRemaining(periods[activeIndex]?.durationSec ?? 0);
  const next = () => setActiveIndex((i) => Math.min(periods.length - 1, i + 1));

  const activePeriod = periods[activeIndex];
  const minutes = useMemo(() => Math.floor(remaining / 60), [remaining]);
  const seconds = useMemo(() => remaining % 60, [remaining]);

  return {
    activeIndex,
    activePeriod,
    running,
    remaining,
    minutes,
    seconds,
    start,
    pause,
    reset,
    next,
    setActiveIndex,
  } as const;
}
