const Role = require("../../Role");

module.exports = class Cthulhu extends Role {
  constructor(player, data) {
    super("Cthulhu", player, data);

    this.alignment = "Monsters";
    this.cards = [
      "VillageCore",
      "WinWithMonsters",
      "MeetingMonster",
      "MakeVisitorsInsane",
    ];
  }
};
