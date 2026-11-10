// TODO / note: slang containing spaces currently does not work (although this list may contain it)

export const commandList = {
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
      "When extensions are enabled, type /extend during Day to vote for more time. The required tally is half the players still in play (alive and not in the safehouse), rounded up, plus one for each extension already granted that Day. At an eligible Day timeout, living members who can vote in the Village meeting also add to the tally if they have no current Village vote and have not already voted /extend toward that tally. After an extension, the tally resets and players can vote again.",
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
  "/Nightorder": {
    input: "N/A",
    description:
      "Lists the Night Order for the Setup (Ties are resloved by Player Order).",
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
