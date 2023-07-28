const Role = require("../../Role");

module.exports = class Diabolist extends Role {
  constructor(player, data) {
    super("Diabolist", player, data);
    this.alignment = "Leader";
    this.cards = ["VillageCore", "WinWithEvil", "NightKiller", "CurseVote"];
  }
};
