// Before newspapers, each obituary snippet was an ordinary server alert.
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

  return message.obituaries.flatMap((obituary, index) =>
    ["deathMessage", "revealMessage", "lastWill"].flatMap((snippet) => {
      const content = obituary.snippets[snippet];
      return content
        ? [alert(`${obituary.id || index}:${snippet}`, content)]
        : [];
    })
  );
}
