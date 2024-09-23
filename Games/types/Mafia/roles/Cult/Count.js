const Role = require("../../Role");

module.exports = class Count extends Role {
  constructor(player, data) {
    super("Count", player, data);

    this.alignment = "Cult";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "Add2Banished",
    ];
  }
};
