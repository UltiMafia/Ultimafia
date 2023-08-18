const Role = require("../../Role");

module.exports = class Sleepwalker extends Role {
  constructor(player, data) {
    super("Sleepwalker", player, data);
    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "SleepWalk"];
  }
};
