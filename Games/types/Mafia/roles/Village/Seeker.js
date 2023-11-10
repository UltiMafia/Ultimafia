const Role = require("../../Role");

module.exports = class Seeker extends Role {
  constructor(player, data) {
    super("Seeker", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "GuessAdversaryKill"];
    this.roleToGuess = ['Hider'];
    this.meetingMods = {
      "Guess Adversary": {
        actionName: "Guess Hider",
      },
    };
  }
};
