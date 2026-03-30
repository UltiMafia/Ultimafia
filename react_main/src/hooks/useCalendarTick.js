import { useEffect, useState } from "react";

/** Re-render periodically so date-based UI (e.g. forced Retro theme) updates around midnight. */
export function useCalendarTick(intervalMs = 60_000) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return tick;
}
