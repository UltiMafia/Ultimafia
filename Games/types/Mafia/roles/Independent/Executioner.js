const Role = require("../../Role");

module.exports = class Executioner extends Role {
  constructor(player, data) {
    super("Executioner", player, data);

    this.alignment = "Independent";
    this.winCount = "Village";
    this.cards = ["VillageCore", "WinByCondemning"];
  }
};
