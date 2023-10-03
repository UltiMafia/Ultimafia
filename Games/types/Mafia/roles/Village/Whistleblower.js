const Role = require("../../Role");

module.exports = class Whistleblower extends Role {
  constructor(player, data) {
    super("Whistleblower", player, data);
    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "BlowWhistle"];
  }
};
