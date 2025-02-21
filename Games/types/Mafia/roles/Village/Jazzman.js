const Role = require("../../Role");

module.exports = class Jazzman extends Role {
  constructor(player, data) {
    super("Jazzman", player, data);

    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "DeliriateEveryoneOnEvilCondemn",
    ];
  }
};
