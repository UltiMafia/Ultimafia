const Role = require("../../Role");

module.exports = class Pyromaniac extends Role {
  constructor(player, data) {
    super("Pyromaniac", player, data);
    this.alignment = "Village";
    this.cards = ["VillageCore", "WinAmongLastTwo", "DouseInGasoline"];
  }
};
