const Role = require("../../Role");

module.exports = class Nurse extends Role {
  constructor(player, data) {
    super("Nurse", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "NightNurse"];
  }
};
