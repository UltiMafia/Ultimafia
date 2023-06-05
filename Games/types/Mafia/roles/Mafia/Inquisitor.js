const Role = require("../../Role");

module.exports = class Inquisitor extends Role {
  constructor(player, data) {
    super("Inquisitor", player, data);

    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithMafia",
      "MeetingMafia",
      "GuessAdversaryKill",
    ];
    this.roleToGuess = "Seeker";
    this.meetingMods = {
      "Guess Adversary": {
        actionName: "Guess Seeker",
      },
    };
  }
};
