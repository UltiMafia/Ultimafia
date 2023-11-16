const Role = require("../../Role");

module.exports = class Don extends Role {
  constructor(player, data) {
    super("Don", player, data);

    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithMafia",
      "MeetingMafia",
      "OverturnVote",
    ];
  }
};
