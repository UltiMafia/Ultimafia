const Role = require("../../Role");

module.exports = class Forensicist extends Role {
  constructor(player, data) {
    super("Forensicist", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "CountWrongReveals"];
  }
};
