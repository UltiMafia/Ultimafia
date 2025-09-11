const Role = require("../../Role");

module.exports = class Busybody extends Role {
  constructor(player, data) {
    super("Busybody", player, data);
    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "StyleContest",
      //"WatchPlayerBoolean",
    ];
  }
};
