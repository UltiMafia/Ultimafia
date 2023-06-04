const Role = require("../../Role");

module.exports = class Medium extends Role {
  constructor(player, data) {
    super("Medium", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "SeanceTarget"];
  }
};
