const Role = require("../../Role");

module.exports = class DeepOne extends Role {
  constructor(player, data) {
    super("Deep One", player, data);

    this.alignment = "Hostile";
    this.cards = [
      "VillageCore",
      "MeetingCult",
      "CannotVoteInCultMeeting",
      "TaintConversions",
      "AnonymizeCult",
      "WinWithDeepOnes",
    ];
  }
};
