const Role = require("../../Role");

module.exports = class Werewolf extends Role {
  constructor(player, data) {
    super("Werewolf", player, data);

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
