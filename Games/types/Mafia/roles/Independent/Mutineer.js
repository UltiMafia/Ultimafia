const Role = require("../../Role");

module.exports = class Mutineer extends Role {
  constructor(player, data) {
    super("Mutineer", player, data);

    this.alignment = "Independent";
    this.cards = [
      "VillageCore",
      "MeetingMafia",
      "AnonymizeMafia",
      "CannotVoteInMafiaMeeting",
      "WinIfLastTwoAndNoMafiaAlive",
      "NightKiller",
    ];
  }
};
