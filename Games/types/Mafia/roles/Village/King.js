const Role = require("../../Role");

module.exports = class King extends Role {
  constructor(player, data) {
    super("King", player, data);

    this.alignment = "Village";
    this.meetingMods = {
      Village: {
        voteWeight: Infinity,
      },
      "Room 1": {
        voteWeight: Infinity,
      },
      "Room 2": {
        voteWeight: Infinity,
      },
    };
    this.cards = ["VillageCore", "WinWithFaction", "MeetingFaction"];
  }
};
