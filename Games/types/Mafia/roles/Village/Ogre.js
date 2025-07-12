const Role = require("../../Role");

module.exports = class Ogre extends Role {
  constructor(player, data) {
    super("Ogre", player, data);

    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "GuessTheOgre",
    ];
  }
};
