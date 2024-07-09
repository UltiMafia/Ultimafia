// TODO / note: slang containing spaces currently does not work (although this list may contain it)

export const commandList = {
  kick: {
    input: "Username",
    description:
      "Kicklim (Kick-condemn). condemning a player which has not voted yet (in order to maintain the game ranked).",
  },
  ban: {
    input: "Username",
    description:
      "Away From Keyboard: when a player stop taking part in a discussion in a chat room for a short time. This can be scummy sometimes.",
  },
  me: {
    input: "Text",
    description: "Alternate Account.",
  },
  extend: {
    input: "N/A",
    description:
      "Bandwagon. Occurs when someone decides to vote someone during the day phase as their condemn target, and the whole town follows, without having substantial evidence.",
  },
  role: {
    input: "Role name",
    description:
      "A Blitz: a rapid vote, usually the hammer, as by the time the blitz is noticed, the mafia has already won or it is too late. It is usually employed by the mafia in MYLO or LYLO situations to quickly condemn someone if an inattentive town has a stray vote, and the mafia has the hammer to themselves.",
  },
  hack: {
    input: "N/A",
    description:
      "Bussing: when a mafia member backstabs a fellow mafia to get the trust of the villagers, usually by supporting (and possibly even leading) a condemn against their fellow mafia.",
  },
};