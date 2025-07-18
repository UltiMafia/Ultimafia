const Role = require("../../Role");

module.exports = class Jack extends Role {
  constructor(player, data) {
    super("Jack", player, data);

    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "BecomeBanishedRoleFor1Phase",
    ];
  }
};
