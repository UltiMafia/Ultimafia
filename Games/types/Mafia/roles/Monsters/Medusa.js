const Role = require("../../Role");

module.exports = class Medusa extends Role {
  constructor(player, data) {
    super("Medusa", player, data);

    this.alignment = "Monsters";
    this.cards = [
      "VillageCore",
      "WinWithMonsters",
      "MeetingMonster",
      "EnqueueVisitors",
      "CountVisitors",
      "TurnToStone",
    ];
  }
};
