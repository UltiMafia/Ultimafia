const Role = require("../../Role");

module.exports = class Eve extends Role {
  constructor(player, data) {
    super("Eve", player, data);

    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithMafia",
      "MeetingMafia",
      "TakeTheApple",
    ];
  }
};
