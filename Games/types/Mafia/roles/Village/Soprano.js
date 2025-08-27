const Role = require("../../Role");

module.exports = class Soprano extends Role {
  constructor(player, data) {
    super("Soprano", player, data);

    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "NightSaveAndLifeLink",
    ];
  }
};
