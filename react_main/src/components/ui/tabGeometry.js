// Keep a selected tab visible when a scrollable strip changes size. This only
// adjusts the strip itself; scrollIntoView would also move the surrounding page.
export function selectedTabScrollDelta(windowStart, windowEnd, tabStart, tabEnd) {
  if (windowEnd <= windowStart || tabEnd <= tabStart) return 0;
  if (tabEnd - tabStart > windowEnd - windowStart) return tabStart - windowStart;
  if (tabStart < windowStart) return tabStart - windowStart;
  if (tabEnd > windowEnd) return tabEnd - windowEnd;
  return 0;
}
