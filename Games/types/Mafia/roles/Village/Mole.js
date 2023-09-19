const Role = require("../../Role");

module.exports = class Mole extends Role {
  constructor(player, data) {
    super("Mole", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "MeetingMafia", "AnonymizeMafia"];
  }
};
