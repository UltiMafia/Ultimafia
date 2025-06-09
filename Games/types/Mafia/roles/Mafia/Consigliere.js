const Role = require("../../Role");

module.exports = class Consigliere extends Role {
  constructor(player, data) {
    super("Consigliere", player, data);

    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "BecomeBanishedRoleFor1Phase",
    ];
  }
};
