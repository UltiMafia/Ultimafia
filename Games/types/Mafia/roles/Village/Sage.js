const Role = require("../../Role");

module.exports = class Sage extends Role {
  constructor(player, data) {
    super("Sage", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "MakePlayerLearnOneOfTwoPlayersOnDeath"];
  }
};
