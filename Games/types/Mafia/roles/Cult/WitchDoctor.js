const Role = require("../../Role");

module.exports = class WitchDoctor extends Role {
  constructor(player, data) {
    super("Witch Doctor", player, data);

    this.alignment = "Cult";
    this.cards = ["VillageCore", "WinWithCult", "MeetingCult", "ConvertSave"];
  }
};
