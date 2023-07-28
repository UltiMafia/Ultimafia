const Role = require("../../Role");

module.exports = class Mortician extends Role {
  constructor(player, data) {
    super("Mortician", player, data);
    this.alignment = "Villager";
    this.cards = ["VillageCore", "WinWithGood", "LearnCondemnedRoles"];
  }
};
