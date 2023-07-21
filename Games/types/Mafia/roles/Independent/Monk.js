const Role = require("../../Role");

module.exports = class Monk extends Role {
  constructor(player, data) {
    super("Monk", player, data);

    this.alignment = "Independent";
    this.winCount = "Village";
    this.cards = ["VillageCore", "MonkSave", "WinIfSaves"];

    this.meetingMods = {
      "*": {
        voteWeight: 0,
      },
    };
  }
};