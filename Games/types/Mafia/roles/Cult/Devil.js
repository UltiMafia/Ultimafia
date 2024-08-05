const Role = require("../../Role");

module.exports = class Devil extends Role {
  constructor(player, data) {
    super("Devil", player, data);

    this.alignment = "Cult";
    this.cards = [
      "VillageCore",
      "WinWithCult",
      "MeetingCult",
      "ChoirOfRoles",
    ];
  }
};
