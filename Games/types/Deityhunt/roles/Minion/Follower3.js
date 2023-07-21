const Role = require("../../Role");

module.exports = class Follower3 extends Role {
  constructor(player, data) {
    super("Follower3", player, data);
    this.alignment = "Follower";
    this.cards = ["VillageCore", "WinWithEvil", "BecomeTwinsWithPlayer"];
  }
};
