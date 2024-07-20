const Role = require("../../Role");

module.exports = class Butler extends Role {
  constructor(player, data) {
    super("Butler", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "VoteWithMaster"];
  }
};
