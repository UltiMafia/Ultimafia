const Role = require("../../Role");

module.exports = class Sidhe extends Role {
  constructor(player, data) {
    super("Sidhe", player, data);

    this.alignment = "Cult";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "BecomeBanishedRoleFor1Phase",
    ];
  }
};
