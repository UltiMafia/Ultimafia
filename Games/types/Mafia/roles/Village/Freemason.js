const Role = require("../../Role");

module.exports = class Freemason extends Role {
  constructor(player, data) {
    super("Freemason", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "MeetWithMasons"];
  }
};
