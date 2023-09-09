const Role = require("../../Role");

module.exports = class Troublemaker extends Role {
  constructor(player, data) {
    super("Troublemaker", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "SwapTwoOtherRoles"];
  }
};
