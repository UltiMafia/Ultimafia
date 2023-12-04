const Role = require("../../Role");

module.exports = class Necromancer extends Role {
  constructor(player, data) {
    super("Necromancer", player, data);
    this.alignment = "Cult";
    this.cards = ["VillageCore", "WinWithCult", "MeetingCult", "Revive"];
  }
};
