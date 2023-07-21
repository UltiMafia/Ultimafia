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
      "WinIfLastMafia",
      "NightKiller",
    ];
    this.appearance = {
      self: "real",
      reveal: "real",
      lynch: "real",
      death: "real",
      investigate: "Mafioso",
    };
  }
};