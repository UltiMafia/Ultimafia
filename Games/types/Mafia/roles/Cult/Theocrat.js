const Role = require("../../Role");

module.exports = class Theocrat extends Role {
  constructor(player, data) {
    super("Theocrat", player, data);

    this.alignment = "Cult";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",

      "MakeCondemnImmune",
    ];
  }
};
