const Role = require("../../Role");

module.exports = class CatLady extends Role {
  constructor(player, data) {
    super("Cat Lady", player, data);
    this.alignment = "Cult";
    this.cards = ["VillageCore", "WinWithCult", "MeetingCult", "CatGiver"];
  }
};
