const Role = require("../../Role");

module.exports = class Possessor extends Role {
  constructor(player, data) {
    super("Possessor", player, data);
    this.alignment = "Leader";
    this.cards = ["VillageCore", "WinWithEvil", "NightKillerPossessor", "RoleModifyAdd1Outcast"];
  }
};
