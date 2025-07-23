const Role = require("../../Role");

module.exports = class Yith extends Role {
  constructor(player, data) {
    super("Yith", player, data);

    this.alignment = "Cult";
    this.cards = ["VillageCore", "GainAbilitesIfTargetDies", "WinWithFaction", "MeetingFaction"];
  }
};
