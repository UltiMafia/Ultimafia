const Role = require("../../Role");

module.exports = class AccursedDoll extends Role {
  constructor(player, data) {
    super("Accursed Doll", player, data);

    this.alignment = "Monsters";
    this.cards = [
      "VillageCore",
      "WinWithMonsters",
      "MeetingMonster",
      "LearnVisitorsPerson",
      "GainKnifeIfVisitedNonMonster",
    ];
  }
};
