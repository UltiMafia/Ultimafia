const Role = require("../../Role");

module.exports = class Rainmaker extends Role {
  constructor(player, data) {
    super("Rainmaker", player, data);

    this.alignment = "Follower";
    this.cards = ["VillageCore", "WinWithEvil", "MakeRain"];
  }
};
