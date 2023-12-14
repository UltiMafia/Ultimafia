const Role = require("../../Role");

module.exports = class Doorman extends Role {
  constructor(player, data) {
    super("Doorman", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "Rolestopper"];
  }
};
