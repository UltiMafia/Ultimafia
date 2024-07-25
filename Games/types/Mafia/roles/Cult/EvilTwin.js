const Role = require("../../Role");

module.exports = class EvilTwin extends Role {
  constructor(player, data) {
    super("Evil Twin", player, data);

    this.alignment = "Cult";
    this.cards = ["VillageCore", "WinWithCult", "MeetingCult", "Twins"];
  }
};
