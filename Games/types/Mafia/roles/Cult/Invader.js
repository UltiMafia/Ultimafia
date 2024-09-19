const Role = require("../../Role");

module.exports = class Invader extends Role {
  constructor(player, data) {
    super("Invader", player, data);

    this.alignment = "Cult";
    this.cards = [
      "VillageCore",
      "WinWithFaction", "MeetingFaction",
      
      "GuessAdversaryConvert",
      "AddHideAndSeek",
    ];
    this.roleToGuess = ["Seeker", "Hider"];
    this.meetingMods = {
      "Guess Adversary": {
        actionName: "Find Them",
      },
    };
  }
};
