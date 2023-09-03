const Role = require("../../Role");

module.exports = class Admirer extends Role {
  constructor(player, data) {
    super("Admirer", player, data);

    this.alignment = "Independent";
    this.winCount = "Village";
    this.cards = ["VillageCore", "WinAmongLastTwo", "BecomeSKOnDeath"];
  }
};
