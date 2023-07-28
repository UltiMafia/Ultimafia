const Role = require("../../Role");

module.exports = class Mindwarper extends Role {
  constructor(player, data) {
    super("Mindwarper", player, data);

    this.alignment = "Follower";
    this.cards = ["VillageCore", "WinWithEvil", "Mindwarper"];
  }
};
