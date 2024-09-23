const Role = require("../../Role");

module.exports = class Leech extends Role {
  constructor(player, data) {
    super("Leech", player, data);

    this.alignment = "Cult";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",

      "LeechBlood",
      "Bloodthirsty",
    ];
  }
};
