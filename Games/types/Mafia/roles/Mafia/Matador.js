const Role = require("../../Role");

module.exports = class Matador extends Role {
  constructor(player, data) {
    super("Matador", player, data);

    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithMafia",
      "MeetingMafia",
      "RedirectActionToSelf",
    ];
  }
};
