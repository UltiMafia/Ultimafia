const Role = require("../../Role");

module.exports = class Blackmailer extends Role {
  constructor(player, data) {
    super("Blackmailer", player, data);

    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "MakeShyOnRoleShare",
    ];
  }
};
