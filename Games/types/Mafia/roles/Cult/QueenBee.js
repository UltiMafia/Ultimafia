const Role = require("../../Role");

module.exports = class QueenBee extends Role {
  constructor(player, data) {
    super("Queen Bee", player, data);
    this.alignment = "Cult";
    this.cards = ["VillageCore", "WinWithCult", "MeetingCult", "DelayAction"];
  }
};
