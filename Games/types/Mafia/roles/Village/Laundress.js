const Role = require("../../Role");

module.exports = class Laundress extends Role {
  constructor(player, data) {
    super("Laundress", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "LearnOneOfTwoPlayers"];
  }
};
