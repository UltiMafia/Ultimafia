const Role = require("../../Role");

module.exports = class Rival extends Role {
  constructor(player, data) {
    super("Rival", player, data);

    this.alignment = "Independent";
    this.winCount = "Village";
    this.cards = ["VillageCore", "WinIfRivalIsDead", "AddCopyOfRole"];
    this.meetings = {
      "Rap Battle": {
        states: ["Night"],
        flags: ["group", "speech"],
      },
    };
  }
};
