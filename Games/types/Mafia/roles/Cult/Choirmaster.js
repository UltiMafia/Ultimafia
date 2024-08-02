const Role = require("../../Role");

module.exports = class Choirmaster extends Role {
  constructor(player, data) {
    super("Choirmaster", player, data);

    this.alignment = "Cult";
    this.cards = [
      "VillageCore",
      "WinWithCult",
      "MeetingCult",
      "ChoirOfRoles",
    ];
  }
};
