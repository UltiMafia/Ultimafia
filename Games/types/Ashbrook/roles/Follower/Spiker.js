const Role = require("../../Role");

module.exports = class Spiker extends Role {
  constructor(player, data) {
    super("Spiker", player, data);

    this.alignment = "Follower";
    this.cards = ["VillageCore", "WinWithEvil", "SkipNightAndInsane"];
  }
};
