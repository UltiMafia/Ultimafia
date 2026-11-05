export function canComposeForumReply(thread, user) {
  return Boolean(
    user.perms?.postReply &&
    (!thread.locked || user.perms.postInLocked) &&
    !thread.isMuted &&
    (!thread.restricted || thread.author?.id === user.id || thread.isAllowedPoster)
  );
}

// Keep the forum's existing quote, author link and original-post link unchanged.
export function appendForumQuote(content, reply, threadId) {
  if (!reply) return content;
  const profilePath = reply.author.vanityUrl
    ? `/user/${reply.author.vanityUrl}`
    : `/user/${reply.author.id}`;
  const heading = `${content}\n\n> ##### [${reply.author.name}](${profilePath}) said: [↻](/community/forums/thread/${threadId}?reply=${reply.id})\n`;
  const quote = reply.content.split("\n").map((line) => `> ${line}`).join("\n");
  return `${heading}${quote}\n\n`;
}
