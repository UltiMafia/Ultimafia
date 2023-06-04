const Role = require("../../Role");

module.exports = class Leader extends Role {
  constructor(player, data) {
    super("Leader", player, data);
    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "LeaderlessOnDeath"];
  }
};
