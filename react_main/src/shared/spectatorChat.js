// Spectator chat shown inline in the game chat, and the spectators list.
// Plain CommonJS with no React so test/spectatorChat.test.js can load it
// directly.
//
// The server still keeps spectator chat in its own "Spectator Meeting". Only
// spectators (and players who are out of the game, who become spectators)
// are members, and the server never sends that meeting or its messages to a
// player, so players in the game cannot see it. The client no longer shows it
// as a separate tab: its messages are merged into the selected chat and
// marked as spectator messages, and a spectator's "Say" goes to it whenever
// they cannot talk in the selected meeting.

const SPECTATOR_MEETING_NAME = "Spectator Meeting";

function isSpectatorChatMeeting(meeting) {
  return !!meeting && meeting.name === SPECTATOR_MEETING_NAME;
}

// The spectator chat meeting in this state's meetings, for spectators only.
function findSpectatorChatMeeting(meetings, isSpectator) {
  if (!isSpectator || !meetings) return null;
  for (const id in meetings) {
    if (isSpectatorChatMeeting(meetings[id])) return meetings[id];
  }
  return null;
}

// Copies of the spectator chat messages, flagged so the chat can mark them.
function spectatorChatMessages(spectatorMeeting) {
  if (!spectatorMeeting || !Array.isArray(spectatorMeeting.messages)) return [];
  return spectatorMeeting.messages.map((message) => ({
    ...message,
    spectatorChat: true,
  }));
}

// Merges the spectator chat into the messages of the selected meeting, in
// time order. Nothing is merged when the spectator meeting itself is the
// selected one (its messages are already there).
function mergeSpectatorChat(messages, spectatorMeeting, selTab) {
  messages = messages || [];
  if (!spectatorMeeting || spectatorMeeting.id === selTab) {
    if (!spectatorMeeting) return messages;
    return spectatorChatMessages(spectatorMeeting);
  }

  const extra = spectatorChatMessages(spectatorMeeting);
  if (extra.length === 0) return messages;

  const merged = [];
  let i = 0;
  let j = 0;
  while (i < messages.length || j < extra.length) {
    if (j >= extra.length) merged.push(messages[i++]);
    else if (i >= messages.length) merged.push(extra[j++]);
    else if ((extra[j].time || 0) < (messages[i].time || 0))
      merged.push(extra[j++]);
    else merged.push(messages[i++]);
  }
  return merged;
}

function canTalkIn(meeting, isPregame) {
  if (!meeting || !meeting.amMember || !meeting.canTalk) return false;
  const memberCount = Array.isArray(meeting.members)
    ? meeting.members.length
    : 0;
  return (
    memberCount > 1 || isPregame || isSpectatorChatMeeting(meeting)
  );
}

// Which meeting "Say" sends to. The selected meeting when the user can talk
// there, otherwise (spectators only) the spectator chat.
function pickSpeechTarget({ activeMeeting, spectatorMeeting, isPregame }) {
  if (activeMeeting && canTalkIn(activeMeeting, isPregame)) {
    return {
      meetingId: activeMeeting.id,
      spectatorChat: isSpectatorChatMeeting(activeMeeting),
    };
  }

  if (spectatorMeeting && canTalkIn(spectatorMeeting, isPregame)) {
    return { meetingId: spectatorMeeting.id, spectatorChat: true };
  }

  return { meetingId: null, spectatorChat: false };
}

// The spectators to list. Everyone sees the list in pregame. Once the game
// has started only spectators see it (players just see the count; the
// server no longer sends them who is watching). The spectators map also
// keeps past spectators so chat can name them; "watching" marks the ones
// spectating now.
function pregameSpectatorList(
  spectators,
  { currentState, stateViewing, review, isSpectator }
) {
  if (review) return [];
  const inPregame =
    Number(currentState) === -1 && Number(stateViewing) === -1;
  if (!inPregame && !isSpectator) return [];
  return Object.values(spectators || {})
    .filter((spectator) => spectator && spectator.watching)
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
}

module.exports = {
  SPECTATOR_MEETING_NAME,
  isSpectatorChatMeeting,
  findSpectatorChatMeeting,
  mergeSpectatorChat,
  pickSpeechTarget,
  pregameSpectatorList,
};
