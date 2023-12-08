const Role = require("../../Role");

module.exports = class Witch extends Role {
  constructor(player, data) {
    super("Witch", player, data);

    this.alignment = "Cult";
    this.cards = [
      "VillageCore",
      "WinWithCult",
      "MeetingCult",
      "RedirectAction",
    ];
  }
};
