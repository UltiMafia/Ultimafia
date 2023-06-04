const Role = require("../../Role");

module.exports = class Leech extends Role {
  constructor(player, data) {
    super("Leech", player, data);

    this.alignment = "Monsters";
    this.cards = [
      "VillageCore",
      "WinWithMonsters",
      "MeetingMonster",
      "LeechBlood",
      "Bloodthirsty",
    ];
  }
};
