const Role = require("../../Role");

module.exports = class Sculptor extends Role {
  constructor(player, data) {
    super("Sculptor", player, data);

    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "GuessStatue",
    ];
    this.roleToGuess = ["Statue"];
  }
};
