const Role = require("../../Role");

module.exports = class Survivor extends Role {
  constructor(player, data) {
    super("Survivor", player, data);

    this.alignment = "Independent";
    this.cards = ["VillageCore", "WinIfAlive"];
  }
};
