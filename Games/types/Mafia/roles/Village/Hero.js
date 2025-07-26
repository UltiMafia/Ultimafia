const Role = require("../../Role");

module.exports = class Hero extends Role {
  constructor(player, data) {
    super("Hero", player, data);

    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "GuessDamsal",
    ];
    this.roleToGuess = ["Damsal"];
  }
};
