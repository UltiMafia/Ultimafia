const Role = require("../../Role");

module.exports = class Toreador extends Role {
  constructor(player, data) {
    super("Toreador", player, data);

    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithMafia",
      "MeetingMafia",
      "RedirectActionToSelf",
    ];
  }
};
