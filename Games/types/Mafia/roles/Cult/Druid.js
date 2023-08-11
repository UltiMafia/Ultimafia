const Role = require("../../Role");

module.exports = class Druid extends Role {
  constructor(player, data) {
    super("Druid", player, data);
    this.alignment = "Cult";
    this.cards = ["VillageCore", "WinWithCult", "MeetingCult", "Treevive"];
  }
};
