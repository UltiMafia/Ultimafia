const Role = require("../../Role");

module.exports = class Shadow extends Role {
  constructor(player, data) {
    super("Shadow", player, data);
    this.alignment = "Cult";
    this.cards = [
      "VillageCore",
      "WinWithCult",
      "MeetingCult",
      "TrackAndWatchPlayer",
    ];
  }
};
