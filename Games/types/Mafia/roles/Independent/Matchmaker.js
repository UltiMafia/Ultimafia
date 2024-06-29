const Role = require("../../Role");

module.exports = class Matchmaker extends Role {
  constructor(player, data) {
    super("Matchmaker", player, data);

    this.alignment = "Independent";
    this.cards = ["VillageCore", "MeetYourMatch", "WinIfLoveConquersAll"];
  }
};
