const Role = require("../../Role");
const { PRIORITY_MAFIA_KILL } = require("../../const/Priority");

module.exports = class Santista extends Role {
  constructor(player, data) {
    super("Santista", player, data);
    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithMafia",
      "MeetingMafia",
      "MeetWithMasons",
    ];
  }
};
