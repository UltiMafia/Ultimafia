const Role = require("../../Role");

module.exports = class Tracker extends Role {
  constructor(player, data) {
    super("Tracker", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "TrackPlayer"];
  }
};
