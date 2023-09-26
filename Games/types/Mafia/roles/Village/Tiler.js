const Role = require("../../Role");

module.exports = class Tiler extends Role {
  constructor(player, data) {
    super("Tiler", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "MeetWithTemplars", "CompassGiver"];
  }
};
