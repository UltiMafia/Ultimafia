const Role = require("../../Role");

module.exports = class Turncoat extends Role {
  constructor(player, data) {
    super("Turncoat", player, data);

    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithVillage",
      "TurnIntoTraitorOnMafiaKill",
    ];
  }
};
