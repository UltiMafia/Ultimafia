const Role = require("../../Role");

module.exports = class Gorgon extends Role {
  constructor(player, data) {
    super("Gorgon", player, data);

    this.alignment = "Cult";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "GorgonMarkVisitors",
      "CountVisitors",
      "TurnToStone",
    ];
  }
};
