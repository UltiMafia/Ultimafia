const Role = require("../../Role");

module.exports = class Doctor extends Role {
  constructor(player, data) {
    super("Doctor", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "NightSaver"];
  }
};
