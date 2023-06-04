const Role = require("../../Role");

module.exports = class Lycan extends Role {
  constructor(player, data) {
    super("Lycan", player, data);

    this.alignment = "Monsters";
    this.cards = [
      "VillageCore",
      "WinWithMonsters",
      "MeetingMonster",
      "BitingWolf",
      "FullMoonInvincible",
      "CauseFullMoons",
    ];
  }
};
