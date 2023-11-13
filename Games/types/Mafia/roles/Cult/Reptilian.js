const Role = require("../../Role");

module.exports = class Reptilian extends Role {
  constructor(player, data) {
    super("Reptilian", player, data);

    this.alignment = "Cult";
    this.cards = [
      "VillageCore",
      "WinWithCult",
      "MeetingCult",
      "OverturnVote",
    ];
  }
};
