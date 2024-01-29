const Role = require("../../Role");

module.exports = class Astrologer extends Role {
  constructor(player, data) {
    super("Astrologer", player, data);

    this.alignment = "Independent";
    this.winCount = "Village";
    this.cards = ["VillageCore", "MakeTargetsInLove", "WinIfPairedLoversAlive"];

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }
        this.player.queueAlert(
          "As above, so below. Observe the motions of the planets and find a pair of lovers that will rebuild this wretched town after it falls."
        );
      }
    };
  }
};
