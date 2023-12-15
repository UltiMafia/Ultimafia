const Role = require("../../Role");

module.exports = class Bogeyman extends Role {
  constructor(player, data) {
    super("Bogeyman", player, data);

    this.alignment = "Cult";
    this.cards = ["VillageCore", "WinWithCult", "MeetingCult", "Visit"];
  }
};
