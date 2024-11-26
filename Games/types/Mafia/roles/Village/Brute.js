const Role = require("../../Role");

module.exports = class Brute extends Role {
  constructor(player, data) {
    super("Brute", player, data);

    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "MakeSkittishOnRoleShare",
    ];
  }
};
