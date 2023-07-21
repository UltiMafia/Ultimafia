const Role = require("../../Role");

module.exports = class Follower1 extends Role {
  constructor(player, data) {
    super("Follower1", player, data);
    this.alignment = "Follower";
    this.cards = ["VillageCore", "WinWithEvil", "ReplaceDeityIfKilled"];
  }
};
