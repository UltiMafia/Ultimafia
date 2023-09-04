const Role = require("../../Role");

module.exports = class Kamog extends Role {
  constructor(player, data) {
    super("Kamog", player, data);

    this.alignment = "Cult";
    this.cards = [
      "VillageCore",
      "WinWithCult",
      "MeetingCult",
      "GuessAdversaryConvert",
    ];
    this.rolesToGuess =  ['Seeker', 'Hider'];
      this.meetingMods = {
      "Guess Adversary": {
        actionName: "Find Them",
      },
    };
  }
};
