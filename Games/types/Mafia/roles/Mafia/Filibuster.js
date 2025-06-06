const Role = require("../../Role");

module.exports = class Filibuster extends Role {
  constructor(player, data) {
    super("Filibuster", player, data);

    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",

      //"CondemnImmune",
      "DiesWithVillageCondemn",
    ];
  }
};
