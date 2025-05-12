const Role = require("../../Role");

module.exports = class Shepherd extends Role {
  constructor(player, data) {
    super("Reaper", player, data);

    this.alignment = "Cult";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "ChooseWinner",
    ];
  }
};
