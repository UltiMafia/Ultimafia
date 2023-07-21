const Role = require("../../Role");

module.exports = class Angel extends Role {
  constructor(player, data) {
    super("Angel", player, data);

    this.alignment = "Independent";
    this.winCount = "Village";
    this.cards = ["VillageCore", "GuardianAngel", "WinIfTargetAlive"];
  }
};