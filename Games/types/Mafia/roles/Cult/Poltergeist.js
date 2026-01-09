const Role = require("../../Role");

module.exports = class Poltergeist extends Role {
  constructor(player, data) {
    super("Poltergeist", player, data);

    this.alignment = "Cult";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "KillIfNoDayKills",
      //"EndangeredGraveyard",
      "CountForMajWhenDead",
    ];
  }
};
