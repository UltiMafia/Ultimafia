const Role = require("../../Role");

module.exports = class Yakuza extends Role {
  constructor(player, data) {
    super("Yakuza", player, data);
    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithMafia",
      "MeetingMafia",
      "CommitSeppuku",
    ];
  }
};
