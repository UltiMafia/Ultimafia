// The API appends reply IDs and keeps the final few records (oldest first).
// Do not mutate retained route data just to present newest activity first.
export function newestRepliesFirst(replies) {
  return [...replies].sort((a, b) => b.postDate - a.postDate);
}
