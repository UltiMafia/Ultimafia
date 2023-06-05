const Role = require("../../Role");

module.exports = class Warlock extends Role {
  constructor(player, data) {
    super("Warlock", player, data);

    this.alignment = "Independent";
    this.winCount = "Village";
    this.cards = ["VillageCore", "WarlockPredictVote", "WinIfPrescientVote"];
  }
};
