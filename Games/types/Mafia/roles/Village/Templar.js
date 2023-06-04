const Role = require("../../Role");

module.exports = class Templar extends Role {
  constructor(player, data) {
    super("Templar", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "MeetWithTemplars"];
  }
};
