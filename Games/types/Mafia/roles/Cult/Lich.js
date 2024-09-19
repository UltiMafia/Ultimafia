const Role = require("../../Role");

module.exports = class Lich extends Role {
  constructor(player, data) {
    super("Lich", player, data);

    this.alignment = "Cult";
    this.cards = [
      "VillageCore",
      "WinWithFaction", "MeetingFaction",
      
      "KillAndCreateUndead",
      "Endangered",
      "Remove1Banished",
    ];
  }
};
