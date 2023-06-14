const Role = require("../../Role");

module.exports = class Witch extends Role {
  constructor(player, data) {
    super("Witch", player, data);

    this.alignment = "Monsters";
    this.cards = [
      "VillageCore",
      "WinWithCult",
      "MeetingCult",
      "RedirectAction",
      "EclipseOnDeath",
    ];
  }
};
