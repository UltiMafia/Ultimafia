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
      "Used during the day phase to give more time to players while deliberating on the vote.",
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
  "/help": {
    input: "N/A",
    description: "Lists the commands on the site.",
  },
};
