const Role = require("../../Role");

module.exports = class Seeker extends Role {
  constructor(player, data) {
    super("Seeker", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "GuessAdversaryKill","AddHideAndSeek"];
    this.roleToGuess = ["Hider","Invader"];
    this.meetingMods = {
      "Guess Adversary": {
        actionName: "Guess Hider",
      },
    };
  }
};
