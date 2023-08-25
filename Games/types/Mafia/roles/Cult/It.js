const Role = require("../../Role");

module.exports = class It extends Role {
  constructor(player, data) {
    super("It", player, data);

    this.alignment = "Cult";
    this.cards = [
      "VillageCore",
      "WinWithCult",
      "MeetingCult",
      "GuessAdversaryConvert",
    ];
    this.roleToGuess = "Seeker" && "Hider";
    this.meetingMods = {
      "Guess Adversary": {
        actionName: "Find Them",
      },
    };
  }
};
