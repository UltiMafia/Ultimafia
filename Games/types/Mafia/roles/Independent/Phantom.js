const Role = require("../../Role");

module.exports = class Phantom extends Role {
  constructor(player, data) {
    super("Phantom", player, data);

    this.alignment = "Independent";
    this.cards = ["VillageCore", "WinIfDead"];
  }
};
