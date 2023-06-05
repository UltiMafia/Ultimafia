const Role = require("../../Role");

module.exports = class Watcher extends Role {
  constructor(player, data) {
    super("Watcher", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "WatchPlayer"];
  }
};
