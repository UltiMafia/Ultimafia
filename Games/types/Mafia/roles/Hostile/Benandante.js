const Role = require("../../Role");

module.exports = class Benandante extends Role {
  constructor(player, data) {
    super("Benandante", player, data);

    this.alignment = "Hostile";
    this.winCount = "Mafia" && "Cult";
    this.cards = [
      "VillageCore",
      "MeetingMafia",
      "MeetingCult",
      "WinMafiaCultJoint",
    ];
  }
};