const Role = require("../../Role");

module.exports = class Admirer extends Role {
  constructor(player, data) {
    super("Admirer", player, data);

    this.alignment = "Independent";
    this.cards = ["VillageCore", "WinAmongLastTwo", "BecomeSKOnDeath"];
  }
};
