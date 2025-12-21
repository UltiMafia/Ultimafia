const Role = require("../../Role");

module.exports = class Suborner extends Role {
  constructor(player, data) {
    super("Suborner", player, data);

    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "AddCopyOfRole",
      "MustRoleShareWithVip",
    ];
  }
};
