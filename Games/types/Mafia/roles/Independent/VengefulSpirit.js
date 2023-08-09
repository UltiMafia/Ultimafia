const Role = require("../../Role");

module.exports = class VengefulSpirit extends Role {
  constructor(player, data) {
    super("Vengeful Spirit", player, data);

    this.alignment = "Independent";
    this.winCount = "Village";
    this.cards = ["VillageCore", "NightKiller", "WinIfTargetDead"];
    this.meetingMods = {
      "Solo Kill": {
        whileDead: true,
        whileAlive: false,
        shouldMeet: function () {
          return !this.diedByCondemn;
        },
      },
    };

    this.listeners = {
      death: [
        function (player, killer, deathType) {
          if (player == this.player && deathType == "condemn") {
            this.diedByCondemn = true;
          }
        },
      ],
    };
  }
};
