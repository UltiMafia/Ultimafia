const Role = require("../../Role");

module.exports = class OldMaid extends Role {
  constructor(player, data) {
    super("Old Maid", player, data);

    this.alignment = "Independent";
    this.winCount = "Village";
    this.cards = ["VillageCore", "VillagerToInvestigative", "SwapRoles"];
  }
};
