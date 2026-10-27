// Text for a small unread-count badge, or null when no badge should show.
// Counts over `max` show as "<max>+"; zero, negative or missing counts hide it.
export function formatUnreadBadge(count, max = 99) {
  const n = Math.floor(Number(count));
  if (!Number.isFinite(n) || n <= 0) return null;
  return n > max ? `${max}+` : String(n);
}
