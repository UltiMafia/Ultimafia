const Role = require("../../Role");

module.exports = class Tick extends Role {
  constructor(player, data) {
    super("Tick", player, data);

    this.alignment = "Cult";
    this.cards = ["VillageCore", "WinWithCult", "MeetingCult", "SuckBlood"];
  }
};
