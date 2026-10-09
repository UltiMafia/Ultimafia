// Player/obituary entries for the newspapers (win and death papers).
//
// `avatar` is passed through like the player list does: a missing flag means
// the player never uploaded one (users without an `avatar` field, bots,
// review data), so the Avatar shows the default no-avatar image instead of
// requesting a /uploads/<id>_avatar.webp that doesn't exist. Anonymous deck
// avatars arrive as "/decks/..." strings and are kept.
export function newspaperPlayer(player) {
  const userId = player.userId || player.id;
  return {
    key: player.id || userId,
    id: userId,
    name: player.name,
    avatar: player.avatar || false,
    avatarId: player.anonId === undefined ? userId : player.anonId,
  };
}

// Anonymous players have no userId, so key obituaries by player id; several
// deaths in one paper would otherwise share an undefined key.
export function obituaryDeath(obituary) {
  const info = obituary.playerInfo || {};
  return {
    ...newspaperPlayer(info),
    key: obituary.id || info.id || info.userId,
    customEmotes: info.customEmotes,
    deathMessage: obituary.snippets.deathMessage,
    revealMessage: obituary.snippets.revealMessage,
    lastWill: obituary.snippets.lastWill,
  };
}
