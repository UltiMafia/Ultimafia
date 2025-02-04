const Role = require("../../Role");

module.exports = class Admiral extends Role {
  constructor(player, data) {
    super("Admiral", player, data);

    this.alignment = "Independent";
    this.winCount = "Village";
    this.cards = [
      "VillageCore",
      "WinIfVillageWon",
      "AdmiralGame",
    ];

    this.startItems = [
      {
        type: "TreasureChest", this.player
      },
    ];

    
  }
};
