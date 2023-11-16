const Role = require("../../Role");

module.exports = class Ritualist extends Role {
  constructor(player, data) {
    super("Ritualist", player, data);

    this.alignment = "Cult";
    this.cards = ["VillageCore", "WinWithCult", "MeetingCult", "Sacrifice"];
  }
};
