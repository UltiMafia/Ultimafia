const Role = require("../../Role");

module.exports = class Investigator extends Role {
  constructor(player, data) {
    super("Investigator", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "LearnOneOfTwoPlayersIsEvil"];
  }
};
