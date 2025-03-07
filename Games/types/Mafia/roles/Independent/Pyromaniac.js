const Role = require("../../Role");

module.exports = class Pyromaniac extends Role {
  constructor(player, data) {
    super("Pyromaniac", player, data);
    this.alignment = "Independent";
    this.cards = [
      "VillageCore",
      "WinAmongLastTwo",
      "DouseInGasoline",
    ];
  }
};
