const Role = require("../../Role");

module.exports = class Tyler extends Role {
  constructor(player, data) {
    super("Tyler", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "MeetWithTemplars", "CompassGiver"];
  }
};
