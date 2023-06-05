const Role = require("../../Role");

module.exports = class Medusa extends Role {
  constructor(player, data) {
    super("Medusa", player, data);

    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithMafia",
      "MeetingMafia",
      "EnqueueVisitors",
      "CountVisitors",
      "TurnToStone",
    ];
  }
};
