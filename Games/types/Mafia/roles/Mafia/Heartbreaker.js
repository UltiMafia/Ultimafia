const Role = require("../../Role");

module.exports = class Heartbreaker extends Role {
  constructor(player, data) {
    super("Heartbreaker", player, data);
    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithMafia",
      "MeetingMafia",
      "BondedForLife",
      "TakeYouWithMe",
    ];
  }
};
