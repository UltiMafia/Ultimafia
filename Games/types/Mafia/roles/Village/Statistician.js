const Role = require("../../Role");

module.exports = class Statistician extends Role {
  constructor(player, data) {
    super("Statistician", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "CountEvilVotes"];
    this.data.VotingLog = [];
  }
};
