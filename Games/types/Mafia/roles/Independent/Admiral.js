const Role = require("../../Role");

module.exports = class Admiral extends Role {
  constructor(player, data) {
    super("Admiral", player, data);
    
    this.alignment = "Independent";
    this.winCount = "Village";
    this.cards = [
      "VillageCore",
      "AdmiralWin",
      "AdmiralGame",
      "PublicReveal",
      "VoteWeightMax",
    ];

    //this.startItems = ["TreasureChest"];

    
  }
};
