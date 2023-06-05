const Role = require("../../Role");

module.exports = class Governor extends Role {
  constructor(player, data) {
    super("Governor", player, data);

    this.alignment = "Village";
    this.data.overturnsLeft = 1;
    this.cards = ["VillageCore", "WinWithVillage", "OverturnVote"];
  }
};
