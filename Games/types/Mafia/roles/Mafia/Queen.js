const Role = require("../../Role");

module.exports = class Queen extends Role {
  constructor(player, data) {
    super("Queen", player, data);

    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithMafia",
      "MeetingMafia",
      "TakeTheApple",
    ];
  }
};
