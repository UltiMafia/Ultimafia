const Role = require("../../Role");

module.exports = class Politician extends Role {
  constructor(player, data) {
    super("Politician", player, data);

    this.alignment = "Independent";
    this.cards = [
      "VillageCore",
      "ChangeRandomAlignment",
      "WinWithCurrentAlignment",
    ];
    this.meetingMods = {
      "*": {
        voteWeight: 2,
      },
    };
  }
};
