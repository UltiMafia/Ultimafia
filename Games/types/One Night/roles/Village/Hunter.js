const Role = require("../../Role");

module.exports = class Hunter extends Role {
  constructor(player, data) {
    super("Hunter", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "KillVoteOnLynch"];
  }
};
