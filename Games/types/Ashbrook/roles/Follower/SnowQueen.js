const Role = require("../../Role");

module.exports = class SnowQueen extends Role {
  constructor(player, data) {
    super("Snow Queen", player, data);
    this.alignment = "Follower";
    this.cards = ["VillageCore", "WinWithEvil", "CauseSnowstorm"];
  }
};
