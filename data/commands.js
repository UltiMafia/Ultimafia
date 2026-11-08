const commandData = {
  "/kick": {
    input: "Username",
    description:
      "Used during pregame to temporarily remove someone from a game lobby.",
  },
  "/ban": {
    input: "Username",
    description:
      "Used during pregame to permanently remove someone from a game lobby.",
  },
  "/me": {
    input: "Text",
    description: "Used to speak in italics as if roleplaying.",
  },
  "/extend": {
    input: "N/A",
    description:
      "During Day, type /extend and press Enter to vote for more time. Each extension raises the next vote requirement. At timeout, eligible players who have not voted can also count toward an extension.",
  },
  "/role": {
    input: "Role name",
    description: "Used to display role descriptions in chat.",
  },
  "/item": {
    input: "Item name",
    description: "Used to display item descriptions in chat.",
  },
  "/modifier": {
    input: "Modifier name",
    description: "Used to display modifier descriptions in chat.",
  },
  "/achievement": {
    input: "Achievement name",
    description:
      "Used to display achievements descriptions in chat and check if you have the achievement.",
  },
  "/diceroll": {
    input: "Amount, Dice Type",
    description: "Rolls dice, results are shown to everyone.",
  },
  "/join": {
    input: "N/A",
    description:
      "Used by a spectator during pregame to take an open seat in the game.",
  },
  "/spectate": {
    input: "N/A",
    description:
      "Used during pregame to give up your seat and watch as a spectator.",
  },
  "/wave, /shake, /glow, /rainbow, /slide, /flash": {
    input: "Text",
    description:
      "Animates your game chat message once (e.g. /wave hello). Needs Advanced Text Effects from the Shop.",
  },
  "/help": {
    input: "N/A",
    description: "Lists the commands on the site.",
  },
};

module.exports = commandData;
