const Role = require("../../Role");

module.exports = class OldScientist extends Role {
  constructor(player, data) {
    super("OldScientist", player, data);

    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "IfTrueKill",
    ];
  }
};
