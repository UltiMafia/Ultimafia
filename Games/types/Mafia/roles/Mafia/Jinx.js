const Role = require("../../Role");

module.exports = class Jinx extends Role {
  constructor(player, data) {
    super("Jinx", player, data);

    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithMafia",
      "MeetingMafia",
      "CurseWithWord",
    ];
  }
};
