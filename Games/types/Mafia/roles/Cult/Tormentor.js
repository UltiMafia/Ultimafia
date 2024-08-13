const Role = require("../../Role");

module.exports = class Tormentor extends Role {
  constructor(player, data) {
    super("Tormentor", player, data);

    this.alignment = "Cult";
    this.cards = ["VillageCore", "WinWithCult", "MeetingCult", "AddOrRemove1Banished"];
  }
};
