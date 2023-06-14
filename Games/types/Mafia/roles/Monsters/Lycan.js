const Role = require("../../Role");

module.exports = class Lycan extends Role {
  constructor(player, data) {
    super("Lycan", player, data);

    this.alignment = "Cult";
    this.cards = [
      "VillageCore",
      "WinWithCult",
      "MeetingCult",
      "BitingWolf",
      "FullMoonInvincible",
      "CauseFullMoons",
    ];
  }
};
