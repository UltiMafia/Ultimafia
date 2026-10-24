// Compact obituaries use one ordinary server-alert box per death.
// Use only the public snippets, not the player's current role or profile.
export function legacyObituaryMessages(message) {
  const alert = (id, content) => ({
    id: `${message.id}:${id}`,
    senderId: "server",
    time: message.time,
    content,
    tags: ["important"],
  });

  if (message.obituaries.length === 0) {
    return message.source === "Night"
      ? [alert("no-deaths", "No one died last night.")]
      : [];
  }

  return message.obituaries.flatMap((obituary, index) => {
    const obituaryLines = ["deathMessage", "revealMessage", "lastWill"]
      .map((snippet) => obituary.snippets[snippet])
      .filter(Boolean);
    return obituaryLines.length
      ? [{
          ...alert(obituary.id || index, obituaryLines.join("\n")),
          obituaryLines,
        }]
      : [];
  });
}
