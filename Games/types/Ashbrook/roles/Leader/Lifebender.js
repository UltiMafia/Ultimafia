const Role = require("../../Role");

module.exports = class Lifebender extends Role {
  constructor(player, data) {
    super("Lifebender", player, data);
    this.alignment = "Leader";
    this.cards = ["VillageCore", "WinWithEvil", "NightKillerLifebender", "RoleModifyRemove1Outcast"];
  }
};
