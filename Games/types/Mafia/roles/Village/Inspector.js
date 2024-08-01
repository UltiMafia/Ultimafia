const Role = require("../../Role");

module.exports = class Inspector extends Role {
  constructor(player, data) {
    super("Inspector", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "CountWrongReveals"];
  }
};
