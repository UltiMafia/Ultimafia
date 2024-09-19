const Role = require("../../Role");

module.exports = class Mutineer extends Role {
  constructor(player, data) {
    super("Mutineer", player, data);

    this.alignment = "Independent";
    this.cards = [
      "VillageCore",
      "MeetingFaction",
      "AnonymizeFactionMeeting",
      "CannotVoteInMafiaMeeting",
      "WinIfLastTwoAndNoMafiaAlive",
      "NightKiller",
    ];
  }
};
