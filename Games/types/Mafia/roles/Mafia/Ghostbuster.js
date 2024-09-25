const Role = require("../../Role");

module.exports = class Ghostbuster extends Role {
  constructor(player, data) {
    super("Ghostbuster", player, data);

    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",

      "NightExorcise",
    ];
  }
};
