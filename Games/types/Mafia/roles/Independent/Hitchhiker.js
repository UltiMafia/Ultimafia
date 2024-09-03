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

//If this being renamed changes it's name in WinwithMafia.js, WinWithCult.js, and WinWithCurrentAlignment.js
