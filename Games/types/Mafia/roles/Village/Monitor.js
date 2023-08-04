const Role = require("../../Role");

module.exports = class Monitor extends Role {
  constructor(player, data) {
    super("Monitor", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "WatchPlayerRole"];
  }
};
