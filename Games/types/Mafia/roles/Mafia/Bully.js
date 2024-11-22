const Role = require("../../Role");

module.exports = class Bully extends Role {
  constructor(player, data) {
    super("Bully", player, data);

    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "MakeSkittishOnRoleShare",
    ];
  }
};
