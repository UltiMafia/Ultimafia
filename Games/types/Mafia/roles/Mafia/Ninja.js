const Role = require("../../Role");

module.exports = class Ninja extends Role {
  constructor(player, data) {
    super("Ninja", player, data);
    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithMafia",
      "MeetingMafia",
      "MakeKillHidden",
    ];
  }
};
