const Role = require("../../Role");

module.exports = class Follower2 extends Role {
  constructor(player, data) {
    super("Follower2", player, data);
    this.alignment = "Follower";
    this.cards = ["VillageCore", "WinWithEvil", "GiveCondemnImmunity"];
  }
};
