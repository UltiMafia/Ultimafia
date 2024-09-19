const Role = require("../../Role");

module.exports = class Accountant extends Role {
  constructor(player, data) {
    super("Accountant", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithFaction", "MeetingFaction", "EvilPairs"];
  }
};
