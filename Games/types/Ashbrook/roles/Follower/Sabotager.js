const Role = require("../../Role");

module.exports = class Sabotager extends Role {
  constructor(player, data) {
    super("Sabotager", player, data);

    this.alignment = "Follower";
    this.cards = ["VillageCore", "WinWithEvil", "RoleModifyAdd2Outcast"];
    this.reroll = false;
  }
};
