const Role = require("../../Role");

module.exports = class Prophet extends Role {
  constructor(player, data) {
    super("Prophet", player, data);

    this.alignment = "Independent";
    this.winCount = "Village";
    this.cards = ["VillageCore", "Prognosticate", "WinIfPrescient"];
  }
};
