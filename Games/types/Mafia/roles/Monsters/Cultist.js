const Role = require("../../Role");

module.exports = class Cultist extends Role {
  constructor(player, data) {
    super("Cultist", player, data);

    this.alignment = "Monsters";
    this.cards = [
      "VillageCore",
      "WinWithMonsters",
      "MeetingMonster",
      "MeetWithCultists",
      "KillSameRoleOnDeath",
    ];
  }
};
