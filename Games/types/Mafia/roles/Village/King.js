const Role = require("../../Role");

module.exports = class King extends Role {
  constructor(player, data) {
    super("King", player, data);

    this.alignment = "Village";
    this.meetingMods = {
      Village: {
        voteWeight: 99,
      },
    };
    this.cards = ["VillageCore", "WinWithVillage"];
  }
};
