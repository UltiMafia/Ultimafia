const Role = require("../../Role");

module.exports = class Hitchhiker extends Role {
  constructor(player, data) {
    super("Hitchhiker", player, data);

    this.alignment = "Independent";
    this.winCount = "Village";
    this.cards = [
      "VillageCore",
      "BecomeAlignmentOfVisitors",
      "WinWithCurrentAlignment",
      "Oblivious",
    ];
  }
};
