const Role = require("../../Role");

module.exports = class Seer extends Role {
  constructor(player, data) {
    super("Seer", player, data);
    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "RevealEvilPlayersToSelf",
      "LoseIfSeerGuessed",
      "AddDusk",
    ];

    this.appearance = {
      self: "real",
      reveal: "real",
      condemn: "real",
      death: "Villager",
      investigate: "real",
    };
  }
};
