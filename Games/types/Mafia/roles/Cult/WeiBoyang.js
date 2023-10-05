const Role = require("../../Role");

module.exports = class WeiBoyang extends Role {
  constructor(player, data) {
    super("Wei Boyang", player, data);

    this.alignment = "Cult";
    this.cards = ["VillageCore", "WinWithCult", "MeetingCult", "MagicGunGiver"];
  }
};
