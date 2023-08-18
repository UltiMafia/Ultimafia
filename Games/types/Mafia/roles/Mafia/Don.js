const Role = require("../../Role");

module.exports = class Governor extends Role {
  constructor(player, data) {
    super("Don", player, data);

    this.alignment = "Village";
    this.data.overturnsLeft = 1;
    this.cards = ["VillageCore", "WinWithVillage", "OverturnVote"];
    this.meetingMods = {
      "Overturn Vote": {
        shouldMeet: function (target) {
          if (target == "Mafia")
            return;
        },
      },
    };
  }
};
