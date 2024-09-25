const Role = require("../../Role");

module.exports = class Seeker extends Role {
  constructor(player, data) {
    super("Seeker", player, data);

    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "GuessAdversaryKill",
      "AddHideAndSeek",
    ];
    this.roleToGuess = ["Hider", "Invader"];
    this.meetingMods = {
      "Guess Adversary": {
        actionName: "Guess Hider",
      },
    };
  }
};
