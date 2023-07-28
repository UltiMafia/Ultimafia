const Role = require("../../Role");

module.exports = class DeadlyNightshade extends Role {
  constructor(player, data) {
    super("Deadly Nightshade", player, data);
    this.alignment = "Follower";
    this.cards = ["VillageCore", "WinWithEvil", "ReplaceLeaderIfKilled"];
  }
};
