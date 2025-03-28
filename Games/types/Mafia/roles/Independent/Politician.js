const Role = require("../../Role");

module.exports = class Politician extends Role {
  constructor(player, data) {
    super("Politician", player, data);

    this.alignment = "Independent";
    this.winCount = "Village";
    this.cards = [
      "VillageCore",
      "ChangeRandomAlignment",
      "WinWithCurrentAlignment",
      "Oblivious",
      "VoteWeightTwo",
    ];
  }
};
