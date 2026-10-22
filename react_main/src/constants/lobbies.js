export const lobbies = [
  { name: "All", displayName: "All" },
  { name: "Main", displayName: "🔪 Main" },
  { name: "Sandbox", displayName: "⏳ Sandbox" },
  { name: "Competitive", displayName: "💛 Competitive" },
  { name: "Games", displayName: "🎲 Minigames" },
  { name: "Survivor", displayName: "🍹 Survivor" },
  { name: "Roleplay", displayName: "🎭 Roleplay" },
  { name: "Testing", displayName: "🧪 Testing", developerOnly: true },
];

export function lobbiesFor(user) {
  return lobbies.filter(
    (lobby) => !lobby.developerOnly || Boolean(user?.perms?.devApi)
  );
}
