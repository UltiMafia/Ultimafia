const Role = require("../../Role");

module.exports = class Hitman extends Role {
  constructor(player, data) {
    super("Hitman", player, data);

    this.alignment = "Follower";
    this.cards = ["VillageCore", "WinWithEvil", "KillIfOutcastKilledDuringDay", "RoleModifyAddOrRemove1Outcast"];
  }
};
