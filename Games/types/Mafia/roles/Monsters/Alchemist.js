const Role = require("../../Role");

module.exports = class Alchemist extends Role {
  constructor(player, data) {
    super("Alchemist", player, data);

    this.alignment = "Monsters";
    this.cards = [
      "VillageCore",
      "WinWithMonsters",
      "MeetingMonster",
      "PotionCaster",
    ];
  }
};
