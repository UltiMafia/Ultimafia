const Role = require("../../Role");

module.exports = class Admiral extends Role {
  constructor(player, data) {
    super("Admiral", player, data);

    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "AdmiralGame",
      "PublicReveal",
      "VoteWeightMax",
    ];

    //this.startItems = ["TreasureChest"];
  }
};
