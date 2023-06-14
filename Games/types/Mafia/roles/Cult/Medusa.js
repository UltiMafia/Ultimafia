const Role = require("../../Role");

module.exports = class Medusa extends Role {
  constructor(player, data) {
    super("Medusa", player, data);

    this.alignment = "Cult";
    this.cards = [
      "VillageCore",
      "WinWithCult",
      "MeetingCult",
      "EnqueueVisitors",
      "CountVisitors",
      "TurnToStone",
    ];
  }
};
