const Role = require("../../Role");

module.exports = class Tanner extends Role {
  constructor(player, data) {
    super("Tanner", player, data);

    this.alignment = "Independent";
    this.cards = ["VillageCore", "WinWithTanner"];
  }
};
